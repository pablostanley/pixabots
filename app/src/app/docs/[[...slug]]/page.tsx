import { source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";

const SITE_URL = "https://pixabots.com";

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
  const url = `${SITE_URL}/docs/${slug?.join("/") ?? ""}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: `${title} — Pixabots`,
      description,
      url,
      siteName: "Pixabots",
      images: [
        {
          url: `${SITE_URL}/api/pixabot/2156?size=960`,
          width: 960,
          height: 960,
          alt: "Pixabot 2156",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${title} — Pixabots`,
      description,
      images: [`${SITE_URL}/api/pixabot/2156?size=480`],
      creator: "@pablostanley",
    },
  };
}
