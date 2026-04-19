import { source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { SITE_URL } from "@/lib/constants";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  // Fumadocs loader types PageData (no body/toc) but MDX source produces DocData (with body/toc)
  const data = page.data as typeof page.data & { body: React.ComponentType; toc: typeof page.data.toc };
  const MDX = data.body;

  return (
    <DocsPage toc={data.toc}>
      <DocsTitle>{data.title}</DocsTitle>
      <DocsDescription>{data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const title = page.data.title ?? "Docs";
  const description =
    page.data.description ??
    "Pixabots documentation — API reference, SDK guide, and parts catalog.";
  const slugStr = slug?.join("/") ?? "";
  const url = `${SITE_URL}/docs/${slugStr}`;

  const ogTitle = `Pixabots ${title}`;
  const seed = `docs-${slugStr || "index"}`;
  const ogUrl = `${SITE_URL}/api/og?type=grid&title=${encodeURIComponent(ogTitle)}&seed=${encodeURIComponent(seed)}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: `${title} — Pixabots`,
      description,
      url,
      siteName: "Pixabots",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Pixabots`,
      description,
      images: [{ url: ogUrl, alt: ogTitle }],
      site: "@pablostanley",
      creator: "@pablostanley",
    },
  };
}
