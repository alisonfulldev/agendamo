import Link from "next/link";

import { getCurrentBrand } from "@/brands/server";
import { Button } from "@/components/ui/button";

export default async function BusinessNotFound() {
  const brand = await getCurrentBrand();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-heading text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        Confira se o endereço foi digitado certinho. Se o link veio de alguém, peça para conferir
        com o negócio.
      </p>
      <Button asChild>
        <Link href="/">Conhecer o {brand.name}</Link>
      </Button>
    </main>
  );
}
