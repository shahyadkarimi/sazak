import { useGLTF } from "@react-three/drei";

export const useModelLoader = (path) => {
  // Always call useGLTF to maintain hook order, but handle invalid paths
  try {
    if (!path || typeof path !== 'string' || path.trim() === '') {
      return null;
    }
    
    const { scene } = useGLTF(path);
    return scene;
  } catch (error) {
    console.warn('Error in useModelLoader:', error);
    return null;
  }
};
