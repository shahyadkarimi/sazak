import { useGLTF } from "@react-three/drei";

export const useModelLoader = (path) => {
  const { scene } = useGLTF(path);
  return scene;
};
