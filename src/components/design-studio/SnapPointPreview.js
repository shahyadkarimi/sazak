import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useModelStore from '@/store/useModelStore';

const SnapPointPreview = () => {
  const { camera, raycaster, gl } = useThree();
  const snapPoints = useModelStore((state) => state.snapPoints);
  const isPreviewMode = useModelStore((state) => state.isPreviewMode);
  const previewPosition = useModelStore((state) => state.previewPosition);
  const isSnapping = useModelStore((state) => state.isSnapping);

  if (!isPreviewMode || snapPoints.length === 0) return null;

  return (
    <group>
      {snapPoints.map((point, index) => {
        const distance = previewPosition 
          ? Math.sqrt(
              Math.pow(point.position[0] - previewPosition[0], 2) + 
              Math.pow(point.position[2] - previewPosition[2], 2)
            )
          : Infinity;
        
        const isNearby = distance < 2; // Snap distance threshold
        const isActive = isNearby && isSnapping;

        return (
          <group key={index} position={point.position}>
            {/* Snap point indicator with different shapes based on type */}
            <mesh>
              {point.type === 'corner' ? (
                <boxGeometry args={[0.15, 0.15, 0.15]} />
              ) : point.type === 'edge' ? (
                <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
              ) : point.type.startsWith('face-inner') ? (
                <boxGeometry args={[0.1, 0.1, 0.05]} />
              ) : point.type === 'face-corner' ? (
                <boxGeometry args={[0.12, 0.12, 0.12]} />
              ) : point.type.startsWith('face-') ? (
                <boxGeometry args={[0.2, 0.2, 0.05]} />
              ) : (
                <sphereGeometry args={[0.1, 8, 6]} />
              )}
              <meshBasicMaterial 
                color={isActive ? 0x00ff00 : (isNearby ? 0xffff00 : 0x0066ff)}
                transparent
                opacity={isActive ? 0.9 : (isNearby ? 0.7 : 0.5)}
              />
            </mesh>
            
            {/* Glow effect for active points */}
            {isActive && (
              <mesh>
                {point.type === 'corner' ? (
                  <boxGeometry args={[0.25, 0.25, 0.25]} />
                ) : point.type === 'edge' ? (
                  <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
                ) : point.type.startsWith('face-inner') ? (
                  <boxGeometry args={[0.2, 0.2, 0.1]} />
                ) : point.type === 'face-corner' ? (
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                ) : point.type.startsWith('face-') ? (
                  <boxGeometry args={[0.3, 0.3, 0.1]} />
                ) : (
                  <sphereGeometry args={[0.2, 8, 6]} />
                )}
                <meshBasicMaterial 
                  color={0x00ff00}
                  transparent
                  opacity={0.3}
                />
              </mesh>
            )}
            
            {/* Connection line to preview position */}
            {previewPosition && isNearby && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      point.position[0], point.position[1], point.position[2],
                      previewPosition[0], previewPosition[1], previewPosition[2]
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial 
                  color={isActive ? 0x00ff00 : 0xffff00}
                  transparent
                  opacity={0.8}
                  linewidth={3}
                />
              </line>
            )}
            
            {/* Face attachment area preview - show actual attachment surface */}
            {point.type.startsWith('face-') && isNearby && (
              <group>
                {/* Main attachment surface */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[
                    point.attachmentArea?.width || 0.4, 
                    point.attachmentArea?.height || 0.4, 
                    0.05
                  ]} />
                  <meshBasicMaterial 
                    color={isActive ? 0x00ff00 : 0xffff00}
                    transparent
                    opacity={isActive ? 0.6 : 0.4}
                  />
                </mesh>
                
                {/* Border outline for better visibility */}
                <mesh position={[0, 0, 0.03]}>
                  <boxGeometry args={[
                    (point.attachmentArea?.width || 0.4) + 0.1, 
                    (point.attachmentArea?.height || 0.4) + 0.1, 
                    0.01
                  ]} />
                  <meshBasicMaterial 
                    color={isActive ? 0x00ff00 : 0xffff00}
                    transparent
                    opacity={0.8}
                    wireframe
                  />
                </mesh>
                
                {/* Connection arrows pointing to the surface */}
                <mesh position={[0, 0.2, 0]}>
                  <coneGeometry args={[0.05, 0.1, 4]} />
                  <meshBasicMaterial 
                    color={isActive ? 0x00ff00 : 0xffff00}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              </group>
            )}
            
            {/* Model type indicator for robotic structures */}
            {isNearby && point.modelType && (
              <mesh position={[0, 0.4, 0]}>
                <planeGeometry args={[0.3, 0.15]} />
                <meshBasicMaterial 
                  color={isActive ? 0x00ff00 : 0xffff00}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}
            
            {/* Special indicators for robotic connection types */}
            {isNearby && point.type.startsWith('face-inner') && (
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.05, 0.05, 0.05]} />
                <meshBasicMaterial 
                  color={0xff6600}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}
            
            {isNearby && point.type === 'face-corner' && (
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.08, 0.08, 0.08]} />
                <meshBasicMaterial 
                  color={0xff3300}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}
          </group>
        );
      })}
      
      {/* Preview position indicator */}
      {previewPosition && (
        <group position={previewPosition}>
          <mesh>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial 
              color={isSnapping ? 0x00ff00 : 0xff6600}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          {/* Preview outline */}
          <mesh>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshBasicMaterial 
              color={isSnapping ? 0x00ff00 : 0xff6600}
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default SnapPointPreview;
