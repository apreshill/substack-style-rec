"use client";

import { useState } from "react";
import ArchitectureDiagram, {
  GithubIcon,
  MonitorIcon,
  ServerIcon,
  TwelveLabsLogo,
  PixeltableLogo,
} from "@/components/architecture-diagram";

const REPO_URL = "https://github.com/mrnkim/substack-style-rec";

const schemaSnippet = `class Videos(TableModel, name="videos"):
    id = pxt.Column(type=pxt.String, primary_key=True)
    title: pxt.String | None
    video: pxt.Video | None
    raw_attributes = analyze_video(id)
    topic = raw_attributes.topic
    style = raw_attributes.style
    tone = raw_attributes.tone
    scenes = video.scene_detect_histogram(fps=1, threshold=0.9, min_scene_len=900)
    __indexes__ = [pxt.EmbeddingIndex(title, string_embed=marengo)]`;

const sceneIndexSnippet = `class VideoScenes(
    TableModel,
    name="video_scenes",
    base=Videos,
    iterator=pxtf.video.video_splitter(
        video=Videos.video, segment_times=Videos.scenes[1:].start_time, mode="fast"
    ),
):
    __indexes__ = [
        pxt.EmbeddingIndex(
            video_segment,
            embedding=embed_video_retry,  # type: ignore[name-defined]
            string_embed=marengo,
            image_embed=marengo,
            audio_embed=marengo,
        )
    ]`;

const similaritySnippet = `sim = video_scenes.video_segment.similarity(string=query)
results = video_scenes.order_by(sim, asc=False).limit(20).collect()

vecs = video_scenes.where(video_scenes.id == watched_id).select(
    vec=video_scenes.video_segment.embedding()
).collect()
sim = video_scenes.video_segment.similarity(vector=vecs[0]["vec"])`;

const TOC = [
  { id: "stack", label: "The stack" },
  { id: "flow", label: "The flow" },
  { id: "architecture", label: "Architecture" },
  { id: "runtime", label: "Runtime" },
  { id: "code", label: "Integration code" },
  { id: "resources", label: "Resources" },
];

function SectionHeader({
  eyebrow,
  heading,
}: {
  eyebrow: string;
  heading: string;
}) {
  return (
    <>
      <div className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1 font-semibold">
        {eyebrow}
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-brand)] mb-4">
        {heading}
      </h2>
    </>
  );
}

function CodeBlock({
  label,
  path,
  code,
  caption,
}: {
  label: string;
  path?: string;
  code: string;
  caption: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write can fail in some sandboxed contexts
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide whitespace-nowrap">
            {label}
          </span>
          {path && (
            <span className="text-[11px] text-[var(--text-tertiary)] font-[family-name:var(--font-mono)] truncate">
              {path}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label} snippet to clipboard`}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        tabIndex={0}
        className="px-4 py-4 overflow-x-auto text-xs leading-relaxed text-[var(--text-primary)] font-[family-name:var(--font-mono)]"
      >
        <code>{code}</code>
      </pre>
      <div className="px-4 py-3 border-t border-[var(--border-light)] text-xs text-[var(--text-secondary)] leading-relaxed">
        {caption}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  when,
  last = false,
  children,
}: {
  number: number;
  title: string;
  when: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center pt-1">
        <div className="w-7 h-7 rounded-full bg-[var(--accent-muted)] border border-[var(--border-accent)] flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
          {number}
        </div>
        {!last && (
          <div className="w-px flex-1 bg-[var(--border-default)] mt-2 min-h-12" />
        )}
      </div>
      <div className="pb-8 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <span className="text-[11px] font-medium text-[var(--accent)] uppercase tracking-wide">
            {when}
          </span>
        </div>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function ResourceTile({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] transition-colors"
    >
      <div className="text-2xl mb-3 leading-none">{icon}</div>
      <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-1">
        {title}
      </div>
      <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {description}
      </div>
    </a>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="pb-20 animate-fade-up">
      {/* Hero */}
      <section className="px-8 pt-10 pb-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-brand)] mb-4">
          How it works
        </h1>

        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-6 leading-relaxed">
          An AI video discovery app with subscriptions, search, and a
          &ldquo;because you watched&hellip;&rdquo; feed. TwelveLabs models create the
          embeddings and tags for each video. Pixeltable stores the embeddings and
          tags with the videos, and searches the embeddings to answer every search
          and recommendation.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <a
            href="#stack"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] border border-[var(--border-accent)] text-xs font-medium text-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <TwelveLabsLogo className="w-3.5 h-3.5" />
            TwelveLabs · Marengo 3.0 + Analyze
          </a>
          <a
            href="#stack"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] border border-[var(--border-accent)] text-xs font-medium text-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <PixeltableLogo className="w-3.5 h-3.5" />
            Pixeltable · multimodal backend
          </a>
        </div>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
        >
          View source on GitHub
          <span aria-hidden>↗</span>
        </a>
      </section>

      {/* Body: content + sticky TOC at lg+ */}
      <div className="lg:flex lg:max-w-7xl lg:mx-auto lg:gap-12 lg:px-8">
        <main className="space-y-16 lg:flex-1 lg:min-w-0">
          {/* The stack */}
          <section id="stack" className="px-8 lg:px-0 max-w-5xl scroll-mt-20">
            <SectionHeader eyebrow="The stack" heading="What&rsquo;s in this app" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-3">
                  <TwelveLabsLogo className="w-5 h-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    TwelveLabs
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  TwelveLabs builds models for video understanding. This app uses two of
                  them. Marengo 3.0 creates an embedding for each scene clip and for each
                  search query, so a search can find a specific moment in a video. Pegasus
                  1.5, called through the Analyze API, returns the topic, style, and tone
                  of each full video.
                </p>
                <div className="mt-4 flex gap-4 text-xs font-medium">
                  <a
                    href="https://docs.twelvelabs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    Docs →
                  </a>
                  <a
                    href="https://github.com/twelvelabs-io/twelvelabs-python"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    GitHub →
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-3">
                  <PixeltableLogo className="w-5 h-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Pixeltable
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                  Without Pixeltable, this app would need a blob store for the videos, a
                  vector database for the embeddings, an orchestrator to call TwelveLabs,
                  and glue code to keep them in sync. With Pixeltable, adding a video is
                  one insert, and the embeddings and tags follow.
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Pixeltable is an open source multimodal backend for Python, from the
                  creators of Apache Parquet and Impala (Apache 2.0
                  license). In this app, the videos, embeddings, and Analyze results are
                  stored in Pixeltable tables. When you insert a video, Pixeltable calls
                  Marengo and the Analyze API and adds the new scenes to the index.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
                  <a
                    href="https://docs.pixeltable.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    Docs →
                  </a>
                  <a
                    href="https://github.com/pixeltable/pixeltable"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    GitHub →
                  </a>
                  <a
                    href="https://github.com/pixeltable/pixeltable-starter-kit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    Starter kit →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* The flow */}
          <section id="flow" className="px-8 lg:px-0 max-w-5xl scroll-mt-20">
            <SectionHeader
              eyebrow="The flow"
              heading="From a video file to a recommendation"
            />
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-2xl">
              Pixeltable is the backend. It stores the videos and the TwelveLabs
              results, keeps them up to date as videos are added, and answers the
              API&apos;s queries.
            </p>
            <div>
              <StepCard number={1} title="Store the videos" when="Setup">
                Each video is stored as a row, with the video file and its title,
                creator, and category. Those fields were attached when the video was
                uploaded to TwelveLabs.
              </StepCard>
              <StepCard number={2} title="Compute on insert" when="When a video is added">
                When a row is added, Pixeltable calls Pegasus 1.5 through the Analyze
                API and stores the video&apos;s topic, style, and tone in the same row.
                It also splits the video into scenes and gets a Marengo 3.0 embedding
                for each scene. Pixeltable keeps the scene index up to date as videos
                are added or removed. It embeds only the new scenes, so the index is
                never rebuilt.
              </StepCard>
              <StepCard number={3} title="Answer queries" when="Each request">
                The API asks Pixeltable for similar scenes. For a search, Pixeltable
                gets a Marengo embedding for the query and runs a similarity search
                against the scene index. For recommendations, it searches with the
                stored embeddings of scenes you&apos;ve watched, so no TwelveLabs call
                is made.
              </StepCard>
              <StepCard number={4} title="Rank and explain" when="Each request" last>
                The API takes the similar scenes from Pixeltable and keeps a mix of
                creators you follow and new ones. It adds a short{" "}
                <em className="text-[var(--text-primary)]">
                  &ldquo;Because you watched&hellip;&rdquo;
                </em>{" "}
                line to each pick, using the topic, style, and tone stored in step 2,
                and returns the list to the frontend.
              </StepCard>
            </div>
          </section>

          {/* Architecture */}
          <section
            id="architecture"
            className="px-8 lg:px-0 max-w-5xl scroll-mt-20"
          >
            <SectionHeader
              eyebrow="Architecture"
              heading="How the pieces fit together"
            />

            <div className="mb-2">
              <ArchitectureDiagram />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] italic mb-10 text-center">
              Hover any element for details.
            </p>

            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">
              Who does what
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-3">
                  <MonitorIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Frontend (Next.js)
                  </h3>
                </div>
                <ul className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1.5">
                  <li>Tracks which creators you subscribe to and what you&apos;ve watched</li>
                  <li>Renders the pages and handles navigation</li>
                  <li>Saves your state in the browser so it survives a refresh</li>
                </ul>
              </div>

              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-3">
                  <ServerIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    API (FastAPI)
                  </h3>
                </div>
                <ul className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1.5">
                  <li>Exposes the video, creator, search, and recommendation endpoints</li>
                  <li>
                    Fills 70% of recommendations from creators you subscribe to and 30%
                    from new creators
                  </li>
                  <li>Fills in the &ldquo;Because you watched&hellip;&rdquo; line from a template</li>
                </ul>
              </div>

              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-accent)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-3">
                  <PixeltableLogo className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Pixeltable
                  </h3>
                </div>
                <ul className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1.5">
                  <li>
                    Stores the videos, embeddings, and Analyze results in one place, with
                    no separate vector database or blob store
                  </li>
                  <li>Calls scene detection and the Analyze API from computed columns when you insert a video</li>
                  <li>Adds the Marengo embedding of each new scene to the index</li>
                  <li>Runs the similarity queries for search and recommendations</li>
                </ul>
              </div>

              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-3">
                  <TwelveLabsLogo className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    TwelveLabs
                  </h3>
                </div>
                <ul className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1.5">
                  <li>Turns each scene and each search query into a 512-dimensional vector with Marengo 3.0</li>
                  <li>Returns the topic, style, and tone of each video with Pegasus 1.5, through the Analyze API</li>
                  <li>Streams playback from the TwelveLabs index, with HTTP Live Streaming (HLS)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Runtime */}
          <section id="runtime" className="px-8 lg:px-0 max-w-5xl scroll-mt-20">
            <SectionHeader
              eyebrow="Runtime"
              heading="What runs in Pixeltable and what calls TwelveLabs"
            />
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-2xl">
              The app calls TwelveLabs once for each video when you add it, and once
              for each search to embed the search text. Recommendations use the scene
              embeddings already stored in Pixeltable, so they make no TwelveLabs
              calls. When you add a video, Pixeltable only computes the new rows, so
              you pay for one video of TwelveLabs work, not the whole catalog.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="text-[11px] font-medium text-[var(--accent)] uppercase tracking-wide mb-2">
                  At ingest · once
                </div>
                <div className="text-sm text-[var(--text-primary)] font-semibold mb-2">
                  Upload, embed, and analyze
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Each video goes to TwelveLabs once, when you add it. Pixeltable stores
                  the embeddings and tags, so the app never sends that video again.
                </p>
              </div>
              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="text-[11px] font-medium text-[var(--accent)] uppercase tracking-wide mb-2">
                  At search · live
                </div>
                <div className="text-sm text-[var(--text-primary)] font-semibold mb-2">
                  One API call per search
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Marengo turns your search text into an embedding. Pixeltable compares
                  that embedding with the stored scene embeddings.
                </p>
              </div>
              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="text-[11px] font-medium text-[var(--accent)] uppercase tracking-wide mb-2">
                  For recommendations · live
                </div>
                <div className="text-sm text-[var(--text-primary)] font-semibold mb-2">
                  No TwelveLabs calls
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  The home, watch, and creator pages take the stored embeddings of a few
                  scenes from videos you&apos;ve watched. Pixeltable compares them with
                  the scene index. Nothing is uploaded when a page loads.
                </p>
              </div>
            </div>
          </section>

          {/* Integration code */}
          <section id="code" className="px-8 lg:px-0 max-w-5xl scroll-mt-20">
            <SectionHeader
              eyebrow="Integration code"
              heading="Calling TwelveLabs from Pixeltable, in three snippets"
            />
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-2xl">
              The schema is Python classes in <span className="font-[family-name:var(--font-mono)]">app.py</span>.
              You preview changes with{" "}
              <span className="font-[family-name:var(--font-mono)]">pxt schema diff</span>, apply them with{" "}
              <span className="font-[family-name:var(--font-mono)]">pxt schema update</span>, and insert the rows with{" "}
              <span className="font-[family-name:var(--font-mono)]">load.py</span>.
            </p>
            <div className="space-y-4">
              <CodeBlock
                label="Schema as code"
                path="backend/app.py"
                code={schemaSnippet}
                caption="Each class is a table. Lines with an equals sign are computed columns, which Pixeltable fills in for each new row. Here they get the topic, style, and tone from the Analyze API, and the scene cut times."
              />
              <CodeBlock
                label="Embedding each scene"
                path="backend/app.py"
                code={sceneIndexSnippet}
                caption="A view is a table built from another table. Here each row is one scene clip, and the index embeds each clip with Marengo."
              />
              <CodeBlock
                label="Search and recommendations"
                path="backend/routers/"
                code={similaritySnippet}
                caption="Similarity queries on the scene index. A text search sends the query to Marengo. A recommendation uses an embedding that's already stored, so it makes no TwelveLabs call."
              />
            </div>
          </section>

          {/* Resources */}
          <section id="resources" className="px-8 lg:px-0 max-w-5xl scroll-mt-20">
            <SectionHeader eyebrow="Resources" heading="Where to go next" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <ResourceTile
                href="https://docs.twelvelabs.io"
                icon={<TwelveLabsLogo className="w-6 h-6 text-[var(--accent)]" />}
                title="TwelveLabs docs"
                description="Marengo embeddings, Analyze API, and video indexing."
              />
              <ResourceTile
                href="https://docs.pixeltable.com/overview/quick-start"
                icon={<PixeltableLogo className="w-6 h-6 text-[var(--accent)]" />}
                title="Pixeltable quickstart"
                description="Build your own in the 10-minute quickstart."
              />
              <ResourceTile
                href="https://github.com/pixeltable/pixeltable-starter-kit/tree/main/video-search"
                icon={<PixeltableLogo className="w-6 h-6 text-[var(--accent)]" />}
                title="Video search starter"
                description="The Pixeltable starter kit app closest to this demo."
              />
              <ResourceTile
                href="https://docs.pixeltable.com/howto/providers/working-with-twelvelabs"
                icon={
                  <span className="inline-flex gap-1.5 text-[var(--accent)]">
                    <TwelveLabsLogo className="w-6 h-6" />
                    <PixeltableLogo className="w-6 h-6" />
                  </span>
                }
                title="Pixeltable + TwelveLabs guide"
                description="How to call TwelveLabs models from Pixeltable."
              />
              <ResourceTile
                href={REPO_URL}
                icon={<GithubIcon className="w-6 h-6 text-[var(--accent)]" />}
                title="This app on GitHub"
                description="Full source for the demo."
              />
            </div>
          </section>
        </main>

        {/* Sticky TOC — desktop only */}
        <aside className="hidden lg:block lg:w-48 lg:shrink-0 lg:sticky lg:top-24 lg:self-start lg:pt-2">
          <div className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3 font-semibold">
            On this page
          </div>
          <ul className="space-y-2 text-sm">
            {TOC.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
