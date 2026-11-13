import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { allPosts, getPostBySlug } from "@/lib/posts/index";
import styles from "../blog.module.css";

export async function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  const post = getPostBySlug(p.slug);
  if (!post) return { title: "Not Found" };
  return {
    // Layout's title template appends "| MM Miles" — drop it here so it isn't doubled
    title: post.metaTitle.replace(/\s*\|\s*MM Miles$/, ""),
    description: post.metaDescription,
    alternates: { canonical: `https://www.mmmiles.com/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://www.mmmiles.com/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: post.coverImage
        ? [{ url: `https://www.mmmiles.com${post.coverImage}`, alt: post.coverImageAlt }]
        : [],
    },
  };
}

// ─── URL Auto-Linker ───────────────────────────────────────────────────────────
// Finds URLs in paragraph text and converts them to clickable links
// Works for both https://... and plain domain.com/path formats
function linkifyText(text) {
  const urlRegex = /(https?:\/\/[^\s,]+|[a-z0-9-]+\.[a-z]{2,}\/[^\s,]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#BF9860", textDecoration: "underline" }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// ─── Content Block Renderer ────────────────────────────────────────────────────
function Block({ block, s }) {
  switch (block.type) {

    case "intro":
      return <p className={s.blockIntro}>{block.text}</p>;

    case "h2":
      return <h2 className={s.blockH2}>{block.text}</h2>;

    case "h3":
      return <h3 className={s.blockH3}>{block.text}</h3>;

    // ── paragraph — auto-links any URLs inside the text ──────────────────────
    case "paragraph":
      return (
        <p className={s.blockParagraph}>
          {linkifyText(block.text)}
        </p>
      );

    case "list":
      return (
        <ul className={s.blockList}>
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );

    case "table":
      return (
        <div className={s.tableWrapper}>
          <table className={s.blockTable}>
            <thead>
              <tr>
                {block.headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "tip":
      return (
        <div className={s.blockTip}>
          <span className={s.blockTipIcon}>💡</span>
          <p className={s.blockTipText}>{block.text}</p>
        </div>
      );

    case "warning":
      return (
        <div className={s.blockWarning}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <p className={s.blockWarningText}>{block.text}</p>
        </div>
      );

    case "cars":
      return (
        <div className={s.carCardGrid}>
          {block.items.map((car) => (
            <div key={car.slug} className={s.carCard}>
              <Link href={`/rent/${car.slug}/${car.city}`} className={s.carCardName}>
                {car.name}
              </Link>
              <p className={s.carCardReason}>{car.reason}</p>
              <Link href={`/rent/${car.slug}/${car.city}`} className={s.carCardButton}>
                View {car.name}
              </Link>
            </div>
          ))}
        </div>
      );

    // ── image — Next.js Image component (Unoptimized to save Vercel quota) ──────────
    // Serves original image as-is without Vercel processing
    // Lazy loads — only loads when user scrolls to it
    case "image":
      return (
        <figure className={s.blockFigure}>
          <Image
            src={block.src}
            alt={block.alt}
            width={1200}
            height={630}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "12px",
              display: "block",
            }}
          />
          {block.caption && (
            <figcaption className={s.blockFigureCaption}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "cta":
      return (
        <div className={s.blockCta}>
          <p className={s.blockCtaText}>{block.text}</p>
          <Link href={block.buttonLink} className={s.blockCtaButton}>
            {block.buttonText}
          </Link>
        </div>
      );

    // ── quickstats — visual stat cards shown at top of post ──────────────────
    // Used in Chennai-Coimbatore blog and all future blogs
    // Renders 4 stat cards in a horizontal row
    case "quickstats":
      return (
        <div className={s.quickStatsGrid}>
          {block.items.map((item, i) => (
            <div key={i} className={s.quickStatCard}>
              <div className={s.quickStatValue}>{item.value}</div>
              <div className={s.quickStatLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }) {
  const p = await params;
  const post = getPostBySlug(p.slug);
  if (!post) notFound();

  const otherPosts = allPosts.filter((x) => x.slug !== post.slug).slice(0, 3);

  // ── Schemas ─────────────────────────────────────────────────────────────────
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    image: post.coverImage ? `https://www.mmmiles.com${post.coverImage}` : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author,
      description: post.authorBio || "",
    },
    publisher: {
      "@type": "Organization",
      name: "MM Miles",
      logo: { "@type": "ImageObject", url: "https://www.mmmiles.com/goldlogo.png" },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.mmmiles.com/blog/${post.slug}`,
    },
    // Word count and article section from post metadata
    ...(post.wordCount && { wordCount: post.wordCount }),
    ...(post.articleSection && { articleSection: post.articleSection }),
  };

  const faqSchema = post.faqs?.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mmmiles.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.mmmiles.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://www.mmmiles.com/blog/${post.slug}` },
    ],
  };

  return (
    <>
      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className={styles.postContainer}>
        <div className={styles.postInner}>

          {/* Breadcrumb */}
          <nav className={styles.postBreadcrumb}>
            <Link href="/">Home</Link> &rsaquo;{" "}
            <Link href="/blog">Blog</Link> &rsaquo;{" "}
            <span>{post.title.replace(" | MM Miles", "")}</span>
          </nav>

          {/* Tags */}
          <div className={styles.postTags}>
            {post.tags?.map((tag) => (
              <span key={tag} className={styles.postTag}>{tag}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className={styles.postTitle}>
            {post.title.replace(" | MM Miles", "")}
          </h1>

          {/* Meta — author, date, read time */}
          <div className={styles.postMeta}>
            <span>By {post.author}</span>
            <span>
              {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            <span>{post.readTime}</span>
          </div>

          {/* Cover Image — Unoptimized to save Vercel quota */}
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              width={1200}
              height={630}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "16px",
                marginBottom: "32px",
                display: "block",
              }}
              className={styles.postCoverImage}
            />
          )}

          {/* Content Blocks */}
          <article>
            {post.content.map((block, i) => (
              <Block key={i} block={block} s={styles} />
            ))}
          </article>

          {/* Author Bio — shows if authorBio exists in post data */}
          {post.authorBio && (
            <div className={styles.authorBio}>
              <div className={styles.authorBioAvatar}>
                {post.author.charAt(0)}
              </div>
              <div className={styles.authorBioContent}>
                <div className={styles.authorBioName}>{post.author}</div>
                <div className={styles.authorBioText}>{post.authorBio}</div>
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {post.faqs?.length > 0 && (
            <section className={styles.faqSection}>
              <h2 className={styles.faqSectionTitle}>Frequently Asked Questions</h2>
              {post.faqs.map(({ question, answer }, i) => (
                <details key={i} className={styles.faqItem}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </section>
          )}

          {/* Book Your Car */}
          <section className={styles.bookSection}>
            <h3 className={styles.bookSectionTitle}>Book Your Self Drive Car</h3>
            <div className={styles.bookLinks}>
              {post.relatedCity && (
                <Link href={`/cities/${post.relatedCity.slug}`} className={styles.bookLink}>
                  Self Drive Cars in {post.relatedCity.name} 
                </Link>
              )}
              {/* Second city if post covers two cities */}
              {post.relatedCityTwo && (
                <Link href={`/cities/${post.relatedCityTwo.slug}`} className={styles.bookLink}>
                  Self Drive Cars in {post.relatedCityTwo.name} 
                </Link>
              )}
              {post.relatedCars?.map((car) => (
                <Link
                  key={car.slug}
                  href={`/rent/${car.slug}/${post.relatedCity?.slug || "chennai"}`}
                  className={styles.bookLink}
                >
                  Rent {car.name}
                </Link>
              ))}
            </div>
          </section>

          {/* More Posts */}
          {otherPosts.length > 0 && (
            <section className={styles.morePostsSection}>
              <h3 className={styles.morePostsTitle}>More Road Trip Guides</h3>
              <div className={styles.morePostsGrid}>
                {otherPosts.map((x) => (
                  <Link key={x.slug} href={`/blog/${x.slug}`} className={styles.morePostCard}>
                    <div className={styles.morePostCardTitle}>
                      {x.title.replace(" | MM Miles", "")}
                    </div>
                    <div className={styles.morePostCardExcerpt}>{x.excerpt}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}