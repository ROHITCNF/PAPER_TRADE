import Link from 'next/link';
function Navbar({ profileData }) {
    return (
        <nav className="flex gap-8 md:flex">
            <Link href="/profile" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Profile</Link>
            <Link href="/funds" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Funds</Link>
            <Link href="/reports" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Reports</Link>
            <Link href="/assistant" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Assistant</Link>
            <img src={profileData?.image} alt="" className="w-12 h-12 rounded-full" />
        </nav>
    )
}

export default Navbar;
