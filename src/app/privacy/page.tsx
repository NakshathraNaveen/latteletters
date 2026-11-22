import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & community guidelines",
  description: "What latteletters collects, why, and the house rules for reviews and love notes.",
};

const h2 = "mt-12 font-display text-3xl";
const list = "mt-3 list-disc space-y-2 pl-6";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-serif text-2xl italic">the fine print, but cute</p>
      <h1 className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">privacy &amp; guidelines</h1>
      <p className="mt-3 text-sm text-cola/75">Last updated 21 November 2026</p>

      <p className="mt-6">
        latteletters is a small personal project made in Canada. We collect as little as we can, and we follow the principles of
        Canada&rsquo;s privacy law (PIPEDA). Questions? Email{" "}
        <a href="mailto:latteletters.contact@gmail.com" className="font-semibold underline underline-offset-4">
          latteletters.contact@gmail.com
        </a>
        .
      </p>

      <h2 className={h2}>what we collect</h2>
      <ul className={list}>
        <li>
          <strong>Your email</strong>, only to send you login links. It&rsquo;s never shown on the site, sold or used for marketing.
        </li>
        <li>
          <strong>Your username and cup avatar</strong>. These are public and appear next to your posts.
        </li>
        <li>
          <strong>What you post</strong>: reviews, love notes and photos. These are public. Photos are shrunk in your browser before
          upload, which also removes hidden location (GPS) data from them.
        </li>
        <li>
          <strong>Your saved cafes</strong>. These are private: only you can see your list, and it&rsquo;s deleted with your account.
        </li>
        <li>
          <strong>A login cookie</strong> that keeps you signed in. We don&rsquo;t use advertising or tracking cookies.
        </li>
        <li>
          <strong>Social link clicks</strong> are counted (which cafe and which platform) to show cafes they&rsquo;re getting love.
          This isn&rsquo;t tied to your account.
        </li>
      </ul>

      <h2 className={h2}>what we don&rsquo;t collect</h2>
      <ul className={list}>
        <li>
          Your location. &ldquo;Near me&rdquo; runs in your browser and only sends a rounded area to look up nearby cafes. It&rsquo;s
          never saved.
        </li>
        <li>Passwords (there aren&rsquo;t any) or payment details.</li>
      </ul>

      <h2 className={h2}>where it lives</h2>
      <p className="mt-3">
        Accounts, posts and photos are stored with Supabase, and the site runs on Vercel. Both use servers in the United States, so
        your information may be processed there. Cafe details come from OpenStreetMap.
      </p>
      <p className="mt-3">
        Songs and playlists are played by Spotify&rsquo;s own player. It only loads when you press play, and from then on
        Spotify&rsquo;s privacy policy and cookies apply. When you add a song to a post, we ask Spotify for its title to check
        the link works.
      </p>

      <h2 className={h2}>your choices</h2>
      <ul className={list}>
        <li>Edit or delete any of your posts at any time.</li>
        <li>
          Delete your whole account from{" "}
          <Link href="/settings" className="underline underline-offset-4">
            settings
          </Link>
          . This permanently removes your email, profile, posts and photos.
        </li>
        <li>Ask us what we hold about you, or to correct it, by email.</li>
      </ul>

      <h2 id="guidelines" className={`${h2} scroll-mt-24`}>
        community guidelines
      </h2>
      <p className="mt-3">Love notes are meant to make someone&rsquo;s day, so:</p>
      <ul className={list}>
        <li>Be kind and honest. Talk about the cafe and your visit, not about staff or other people personally.</li>
        <li>No hate, harassment, threats, spam, ads, or fake reviews (including for your own cafe).</li>
        <li>Only post photos you took yourself, and avoid clear shots of other people&rsquo;s faces without their okay.</li>
        <li>Don&rsquo;t share anyone&rsquo;s private information.</li>
      </ul>
      <p className="mt-4">
        Anyone can report a post. Reported posts may be hidden while we take a look, and we may remove posts or accounts that break
        these rules. By posting, you confirm the content is yours to share and you let latteletters show it on the site. You can
        delete it any time.
      </p>
    </article>
  );
}
