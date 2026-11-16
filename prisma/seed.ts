import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

/**
 * Idempotent seed: safe to run multiple times.
 * Creates the admin user + starter content you can then edit in the CMS.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✔ admin user: ${email}`);

  if ((await prisma.profile.count()) === 0) {
    await prisma.profile.create({
      data: {
        name: "Pheakkorny Born",
        headline: "Frontend Developer",
        bio:
          "Frontend developer based in Phnom Penh, Cambodia. I build fast, accessible interfaces " +
          "with React and TypeScript — from design systems and component libraries to " +
          "data-heavy admin consoles.",
        location: "Phnom Penh, Cambodia",
        email,
        socials: {
          linkedin: "https://www.linkedin.com/in/pheakkorny-born-15259b249",
          github: "https://github.com/bornpheakkny",
        },
      },
    });
    console.log("✔ profile");
  }

  const skills = [
    { name: "React", category: "core", color: "#61dafb", level: 90, orbitOrder: 0 },
    { name: "TypeScript", category: "core", color: "#3178c6", level: 88, orbitOrder: 1 },
    { name: "JavaScript", category: "core", color: "#f7df1e", level: 90, orbitOrder: 2 },
    { name: "HTML", category: "core", color: "#e34f26", level: 92, orbitOrder: 3 },
    { name: "CSS", category: "core", color: "#1572b6", level: 90, orbitOrder: 4 },
    { name: "Next.js", category: "framework", color: "#ffffff", level: 80, orbitOrder: 0 },
    { name: "Tailwind CSS", category: "styling", color: "#38bdf8", level: 85, orbitOrder: 0 },
    { name: "Testing", category: "testing", color: "#99425b", level: 75, orbitOrder: 0 },
    { name: "Node.js", category: "backend", color: "#5fa04e", level: 70, orbitOrder: 0 },
  ];
  for (const s of skills) {
    await prisma.skill.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  console.log(`✔ ${skills.length} skills`);

  await prisma.project.upsert({
    where: { slug: "portfolio-tech" },
    update: {},
    create: {
      title: "Portfolio.tech",
      slug: "portfolio-tech",
      summary: "This site — a solar-system themed portfolio with its own headless CMS and API.",
      content:
        "A monorepo with three apps: a Next.js portfolio (Vercel), a React CMS (Vercel) and an " +
        "Express + Prisma API (Render) backed by Neon Postgres, with media on Cloudinary.",
      techStack: ["Next.js", "React", "TypeScript", "Node.js", "Prisma", "PostgreSQL"],
      repoUrl: "https://github.com/bornpheakkny/portfolio.tech.v1",
      featured: true,
      published: true,
    },
  });
  console.log("✔ sample project");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
