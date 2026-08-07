import "vitest";
import { buildCustomDockerImage } from "./tests/scripts/build-custom-docker-image";

export default function setup() {
  buildCustomDockerImage();
}
