import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { stories } from "@/lib/stories";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return stories.map(s=>({slug:s.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const story=stories.find(s=>s.slug===slug);return story?{title:story.title,description:story.dek,openGraph:{title:story.title,description:story.dek,images:[{url:story.image,alt:story.alt}]}}:{title:"Story not found"};}
export default async function StoryPage({params}:Props){const {slug}=await params;const story=stories.find(s=>s.slug===slug);if(!story)notFound();return <main className="article-page"><header className="article-nav"><Link href="/" className="wordmark"><span className="brand-mark">L<span>.</span></span><span>Lens<span className="wordmark-light">Stories</span></span></Link><Link href="/#stories">← Back to the journal</Link></header><div className="article-hero"><Image src={story.image} alt={story.alt} fill priority sizes="100vw"/></div><article className="article-content"><p className="eyebrow">{story.label}　/　{story.minutes} MIN READ</p><h1>{story.title}</h1><p className="article-dek">{story.dek}</p><hr/>{story.paragraphs.map((p,i)=><p className="article-paragraph" key={i}>{p}</p>)}<div className="article-end"><span>END OF STORY　✳</span><Link href="/#stories">Discover another story ↗</Link></div></article><footer className="article-footer"><Link href="/">LensStories</Link><span>A visual journal for a world worth noticing.</span></footer></main>}
