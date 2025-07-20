import { useGLTF } from "@react-three/drei";

export const useModelLoader = (path) => {
  const { scene, nodes } = useGLTF(path);
  console.log(nodes);
  return scene;
};
