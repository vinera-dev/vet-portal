import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book" },
  { href: "/appointment", label: "My appointment" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          Vet Portal
        </Link>
        <nav aria-label="Main" className="site-nav">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
