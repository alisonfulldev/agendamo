import type { Metadata } from "next";

import { PageHeader } from "@/components/panel/page-header";
import { requireOwner } from "@/lib/business/context";
import { publicUrl } from "@/lib/storage/r2";
import { loadCatalog } from "@/lib/web/catalog";

import { CatalogManager } from "./catalog-manager";

export const metadata: Metadata = { title: "Produtos e serviços" };

/** Price in cents as the owner types it ("49,90"). */
const priceText = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");

/** Services (site) or products (store) of a "Site ou Loja" account. */
export default async function WebCatalogPage() {
  const { business } = await requireOwner({ web: true });
  const store = business.product === "store";
  const items = await loadCatalog(business.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={store ? "Produtos" : "Serviços"}
        description={
          store
            ? "O que aparece na sua loja. O cliente escolhe, monta a sacolinha e o pedido chega no seu WhatsApp."
            : "O que você oferece. Cada serviço tem um botão que leva o cliente para o seu WhatsApp."
        }
      />
      <CatalogManager
        store={store}
        items={items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          price: priceText(item.price_cents),
          category: item.category ?? "",
          link: item.link_url ?? "",
          active: item.active,
          imageUrl: publicUrl(item.image_key),
        }))}
      />
    </div>
  );
}
