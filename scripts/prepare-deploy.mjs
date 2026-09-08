import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function pinDeploymentImages(spec, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Deployments require a full Git commit SHA.");
  let count = 0;
  const pinned = spec.replace(/^([ \t]+tag:) latest[ \t]*$/gm, (_, key) => {
    count += 1;
    return `${key} ${commit}`;
  });
  if (count !== 2) throw new Error("Expected the web and migrate image tags in .do/app.yaml; refusing an inconsistent rollout.");
  return pinned;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [commit, destination] = process.argv.slice(2);
  if (!destination) throw new Error("Usage: node scripts/prepare-deploy.mjs <commit SHA> <output spec>");
  const spec = await readFile(new URL("../.do/app.yaml", import.meta.url), "utf8");
  await writeFile(destination, pinDeploymentImages(spec, commit));
  console.log(`Prepared web and migrate deployment for ${commit}.`);
}
