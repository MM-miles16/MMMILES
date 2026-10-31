import Link from "next/link";
import { allPosts } from "@/lib/posts/index";
import styles from "./blog.module.css";

export const metadata = {
  title: "Self Drive Car Rental Blog | Road Trip Guides",
  description:
    "Road trip guides, self drive tips and destination guides from MM Miles. Chennai to Pondicherry, Ooty, Kodaikanal and more.",
  alternates: { canonical: "https://www.mmmiles.com/blog" },
  openGraph: {
    title: "Self Drive Car Rental Blog | MM Miles",
    description: "Road trip guides and self drive tips from MM Miles Chennai.",
    url: "https://www.mmmiles.com/blog",
  },
};

export default function BlogPage() {
  const sorted = [...allPosts].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  return (
    <div className={styles.blogListContainer}>
      <div className={styles.blogListInner}>

        {/* Breadcrumb */}
        <nav className={styles.blogListBreadcrumb}>
          <Link href="/">Home</Link> &rsaquo; <span>Blog</span>
        </nav>

        <h1 className={styles.blogListTitle}>Self Drive Car Rental Blog</h1>
        <p className={styles.blogListSubtitle}>
          Know the What other's facing
        </p>

        <div className={styles.blogGrid}>
          {sorted.map((post) => (
            <article key={post.slug} className={styles.blogCard}>

              {/* Tags */}
              <div className={styles.blogCardTags}>
                {post.tags?.map((tag) => (
                  <span key={tag} className={styles.blogCardTag}>{tag}</span>
                ))}
              </div>

              {/* Title */}
              <Link href={`/blog/${post.slug}`} className={styles.blogCardTitle}>
                {post.title.replace(" | MM Miles", "")}
              </Link>

              {/* Excerpt */}
              <p className={styles.blogCardExcerpt}>{post.excerpt}</p>

              {/* Meta */}
              <div className={styles.blogCardMeta}>
                <span className={styles.blogCardDate}>
                  {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
                <span className={styles.blogCardReadTime}>{post.readTime}</span>
                <Link href={`/blog/${post.slug}`} className={styles.blogCardReadMore}>
                  Read More 
                </Link>
              </div>

            </article>
          ))}
        </div>

      </div>
    </div>
  );
}
