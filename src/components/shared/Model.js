import { useModelLoader } from "@/hooks/useModelLoader";

const Model = ({ path }) => {
  const scene = useModelLoader(path);

  return <primitive object={scene} scale={100} />;
};

export default Model;
