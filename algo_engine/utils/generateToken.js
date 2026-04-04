const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { fyersModel: FyersAPI } = require('fyers-api-v3');

// Runs the interactive Fyers OAuth flow.
// Prints the auth URL, waits for the user to paste back the auth_code
// (or the full redirect URL), then exchanges it for an access_token.
async function generateTokenInteractive({ appId, secretId, redirectUrl }) {
    const fyers = new FyersAPI();
    fyers.setAppId(appId);
    fyers.setRedirectUrl(redirectUrl);

    const authUrl = fyers.generateAuthCode();

    console.log('\n==============================');
    console.log(' Fyers Authentication Required');
    console.log('==============================');
    console.log('\n1. Open this URL in your browser:\n');
    console.log('   ' + authUrl);
    console.log('\n2. Log in with your Fyers credentials.');
    console.log('3. Copy the auth_code shown on the page (or the full redirect URL).');
    console.log('4. Paste it below and press Enter.\n');

    const input = await _prompt('auth_code (or redirect URL): ');
    const authCode = _extractAuthCode(input.trim());

    console.log('\nExchanging auth code for access token...');
    const response = await fyers.generate_access_token({
        secret_key: secretId,
        auth_code: authCode
    });
    console.log(response);

    if (response.s !== 'ok' || !response.access_token) {
        throw new Error(`Token generation failed: ${JSON.stringify(response)}`);
    }

    console.log('Access token generated successfully.\n');
    return { accessToken: response.access_token, authCode };
}

// Writes ACCESS_TOKEN and AUTH_TOKEN into .env.local (creates or updates).
function saveTokensToEnv(accessToken, authCode) {
    const envPath = path.join(__dirname, '../.env.local');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    content = _setEnvVar(content, 'ACCESS_TOKEN', accessToken);
    content = _setEnvVar(content, 'AUTH_TOKEN', authCode);

    fs.writeFileSync(envPath, content);
    console.log('Tokens saved to .env.local\n');
}

// If the user pastes the full redirect URL, extract auth_code from query params.
function _extractAuthCode(input) {
    try {
        const url = new URL(input);
        const code = url.searchParams.get('auth_code');
        if (code) return code;
    } catch {}
    return input;
}

function _prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(question, answer => { rl.close(); resolve(answer); });
    });
}

function _setEnvVar(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    return regex.test(content)
        ? content.replace(regex, line)
        : content + (content.endsWith('\n') ? '' : '\n') + line + '\n';
}

// Returns true if the tokens in process.env are present and accepted by Fyers.
async function _areTokensValid() {
    if (!process.env.ACCESS_TOKEN || !process.env.AUTH_TOKEN) return false;

    const { FYERS_APP_ID, REDIRECT_URL } = require('./constant');
    const fyers = new FyersAPI();
    fyers.setAppId(FYERS_APP_ID);
    fyers.setRedirectUrl(REDIRECT_URL);
    fyers.setAccessToken(process.env.ACCESS_TOKEN);

    try {
        const response = await fyers.get_profile();
        if (response.s === 'ok') {
            console.log(`Tokens valid — logged in as ${response.data?.name ?? 'unknown'}`);
            return true;
        }
        console.warn(`Token check failed: ${response.message || response.s}`);
        return false;
    } catch (err) {
        console.warn('Token check error:', err.message);
        return false;
    }
}

// Checks if tokens are present and valid; if not, runs the interactive OAuth flow,
// saves the result to .env.local, and reloads process.env before returning.
async function ensureTokens() {
    if (await _areTokensValid()) return;

    const { FYERS_APP_ID, FYERS_SECRET_ID, REDIRECT_URL } = require('./constant');

    if (!FYERS_APP_ID || !FYERS_SECRET_ID) {
        throw new Error('FYERS_APP_ID and FYERS_SECRET_ID must be set in .env.local before running');
    }

    const { accessToken, authCode } = await generateTokenInteractive({
        appId:       FYERS_APP_ID,
        secretId:    FYERS_SECRET_ID,
        redirectUrl: REDIRECT_URL
    });

    saveTokensToEnv(accessToken, authCode);
    require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true });
}

module.exports = { generateTokenInteractive, saveTokensToEnv, ensureTokens };
