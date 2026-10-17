import Link from "next/link";

/** "See also" block: a titled list of internal links. */
export function LinkList({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <nav aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
