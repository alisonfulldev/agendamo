import type { WebTemplate } from "@/lib/db/types";
import type { WebTexts } from "@/lib/web/texts";

/** A service (site) or product (store) as the public site shows it. */
export interface WebItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  category: string | null;
  imageUrl: string | null;
}

/** Everything a "Site ou Loja" template draws (built on the server from the business data). */
export interface WebSiteData {
  businessId: string;
  slug: string;
  name: string;
  store: boolean;
  template: WebTemplate;
  texts: WebTexts;
  /** wa.me link with the ready message (null: the owner has no WhatsApp yet). */
  whatsappHref: string | null;
  /** The owner's WhatsApp digits (the bag builds its own message). */
  phone: string | null;
  logoUrl: string | null;
  heroUrl: string | null;
  bio: string | null;
  instagramUrl: string | null;
  place: string;
  photos: { url: string; width: number; height: number }[];
  items: WebItem[];
}
