function getDateFromTimestamp(timestamp) {
    if (!timestamp) return '';
    
    // Convert seconds to milliseconds and create Date object
    const date = new Date(timestamp * 1000);
  
    // Format to locale date string
    return date.toLocaleDateString('en-IN'); // 'en-IN' gives DD/MM/YYYY format
  }

module.exports = { getDateFromTimestamp };