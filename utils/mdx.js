//Server only

import fs from "fs";
import matter from "gray-matter";
import path from "path";

const root = process.cwd();

export function getFiles(folder) {
  const postsDirectory = path.join(process.cwd(), "data/" + folder);
  const fileNames = fs.readdirSync(postsDirectory);
  // Only want to return blog/path and ignore root, replace is needed to work on Windows
  return fileNames.map((file) => file.replace(/\\/g, "/"));
}

export async function getAllFilesFrontMatter(folder) {
  // Get file names under /data/posts

  const postsDirectory = path.join(process.cwd(), "data/" + folder);
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames.map((fileName) => {
    // Remove ".mdx" from file name to get id
    const id = fileName.replace(/\.mdx$/, "");

    // Read mdx file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the id
    return {
      id,
      ...matterResult.data,
    };
  });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getFileBySlug(slug, folder) {
  const mdxPath = path.join(root, "data", folder, `${slug}.mdx`);
  const mdPath = path.join(root, "data", folder, `${slug}.md`);
  const source = fs.existsSync(mdxPath)
    ? fs.readFileSync(mdxPath, "utf8")
    : fs.readFileSync(mdPath, "utf8");

  const frontMatter = matter(source);
  return frontMatter;
}
