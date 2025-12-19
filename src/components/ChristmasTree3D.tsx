import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  shaderMaterial,
  Float,
  Stars,
  Sparkles,
  useTexture,
  Html,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { MathUtils } from "three";
import * as random from "maath/random";
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { getTreeSource, getAllPhotoPaths } from "../treeConfig";

// Lấy source index từ URL query parameter (mặc định là 0)
const getSourceIndexFromURL = (): number => {
  const params = new URLSearchParams(window.location.search);
  const sourceParam = params.get('source');
  if (sourceParam !== null) {
    const sourceIndex = parseInt(sourceParam, 10);
    if (!isNaN(sourceIndex)) {
      return sourceIndex;
    }
  }
  return 0; // Mặc định nguồn 0
};

const currentSource = getTreeSource(getSourceIndexFromURL());
const bodyPhotoPaths = getAllPhotoPaths(currentSource);

const CONFIG = {
  colors: {
    emerald: "#004225",
    gold: "#FFD700",
    silver: "#ECEFF1",
    red: "#D32F2F",
    green: "#2E7D32",
    white: "#FFFFFF",
    warmLight: "#FFD54F",
    lights: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"],
    borders: [
      "#FFFAF0",
      "#F0E68C",
      "#E6E6FA",
      "#FFB6C1",
      "#98FB98",
      "#87CEFA",
      "#FFDAB9",
    ],
    giftColors: ["#D32F2F", "#FFD700", "#1976D2", "#2E7D32"],
    candyColors: ["#FF0000", "#FFFFFF"],
  },
  counts: {
    foliage: 8000, // Giảm từ 15000 xuống 8000
    ornaments: 150, // Giảm từ 300 xuống 150
    elements: 100, // Giảm từ 200 xuống 100
    lights: 200, // Giảm từ 400 xuống 200
  },
  tree: { height: 22, radius: 9 },
  photos: {
    body: bodyPhotoPaths,
  },
};

const FoliageMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(CONFIG.colors.emerald), uProgress: 0 },
  `uniform float uTime; uniform float uProgress; attribute vec3 aTargetPos; attribute float aRandom;
  varying vec2 vUv; varying float vMix;
  float cubicInOut(float t) { return t < 0.5 ? 4.0 * t * t * t : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0; }
  void main() {
    vUv = uv;
    vec3 noise = vec3(sin(uTime * 1.5 + position.x), cos(uTime + position.y), sin(uTime * 1.5 + position.z)) * 0.15;
    float t = cubicInOut(uProgress);
    vec3 finalPos = mix(position, aTargetPos + noise, t);
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = (60.0 * (1.0 + aRandom)) / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    vMix = t;
  }`,
  `uniform vec3 uColor; varying float vMix;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard;
    vec3 finalColor = mix(uColor * 0.3, uColor * 1.2, vMix);
    gl_FragColor = vec4(finalColor, 1.0);
  }`
);
extend({ FoliageMaterial });

// --- Helper: Tree Shape ---
const getTreePosition = () => {
  const h = CONFIG.tree.height;
  const rBase = CONFIG.tree.radius;
  const y = Math.random() * h - h / 2;
  const normalizedY = (y + h / 2) / h;
  const currentRadius = rBase * (1 - normalizedY);
  const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * currentRadius;
  return [r * Math.cos(theta), y, r * Math.sin(theta)];
};

// --- Component: Foliage ---
const Foliage = ({ state }: { state: "CHAOS" | "FORMED" }) => {
  const materialRef = useRef<any>(null);
  const { positions, targetPositions, randoms } = useMemo(() => {
    const count = CONFIG.counts.foliage;
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    const spherePoints = random.inSphere(new Float32Array(count * 3), {
      radius: 25,
    }) as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = spherePoints[i * 3];
      positions[i * 3 + 1] = spherePoints[i * 3 + 1];
      positions[i * 3 + 2] = spherePoints[i * 3 + 2];
      const [tx, ty, tz] = getTreePosition();
      targetPositions[i * 3] = tx;
      targetPositions[i * 3 + 1] = ty;
      targetPositions[i * 3 + 2] = tz;
      randoms[i] = Math.random();
    }
    return { positions, targetPositions, randoms };
  }, []);
  useFrame((rootState, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = rootState.clock.elapsedTime;
      const targetProgress = state === "FORMED" ? 1 : 0;
      materialRef.current.uProgress = MathUtils.damp(
        materialRef.current.uProgress,
        targetProgress,
        1.5,
        delta
      );
    }
  });
  return (
    // @ts-ignore
    <points>
      {/* @ts-ignore */}
      <bufferGeometry>
        {/* @ts-ignore */}
        <bufferAttribute
          /* @ts-ignore */ attach="attributes-position"
          /* @ts-ignore */ args={[positions, 3]}
        />
        {/* @ts-ignore */}
        <bufferAttribute
          /* @ts-ignore */ attach="attributes-aTargetPos"
          /* @ts-ignore */ args={[targetPositions, 3]}
        />
        {/* @ts-ignore */}
        <bufferAttribute
          /* @ts-ignore */ attach="attributes-aRandom"
          /* @ts-ignore */ args={[randoms, 1]}
        />
      </bufferGeometry>
      {/* @ts-ignore */}
      <foliageMaterial
        ref={materialRef}
        /* @ts-ignore */ transparent
        /* @ts-ignore */ depthWrite={false}
        /* @ts-ignore */ blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// --- Component: Photo Ornaments (Double-Sided Polaroid) ---
const PhotoOrnaments = ({ state }: { state: "CHAOS" | "FORMED" }) => {
  const textures = useTexture(CONFIG.photos.body, (loader) => {
    // Tối ưu hóa texture khi load
    loader.forEach((texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.anisotropy = 1;
    });
  });
  const count = CONFIG.counts.ornaments;
  const groupRef = useRef<THREE.Group>(null);

  const borderGeometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.5), []);
  const photoGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * 70,
        (Math.random() - 0.5) * 70,
        (Math.random() - 0.5) * 70
      );
      const h = CONFIG.tree.height;
      const y = Math.random() * h - h / 2;
      const rBase = CONFIG.tree.radius;
      const currentRadius = rBase * (1 - (y + h / 2) / h) + 0.5;
      const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(
        currentRadius * Math.cos(theta),
        y,
        currentRadius * Math.sin(theta)
      );

      const isBig = Math.random() < 0.2;
      const baseScale = isBig ? 2.2 : 0.8 + Math.random() * 0.6;
      const weight = 0.8 + Math.random() * 1.2;
      const borderColor =
        CONFIG.colors.borders[
          Math.floor(Math.random() * CONFIG.colors.borders.length)
        ];

      const rotationSpeed = {
        x: (Math.random() - 0.5) * 1,
        y: (Math.random() - 0.5) * 1,
        z: (Math.random() - 0.5) * 1,
      };
      const chaosRotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      return {
        chaosPos,
        targetPos,
        scale: baseScale,
        weight,
        textureIndex: i % textures.length,
        borderColor,
        currentPos: chaosPos.clone(),
        chaosRotation,
        rotationSpeed,
        wobbleOffset: Math.random() * 10,
        wobbleSpeed: 0.5 + Math.random() * 0.5,
      };
    });
  }, [textures, count]);

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === "FORMED";
    const time = stateObj.clock.elapsedTime;

    groupRef.current.children.forEach((group, i) => {
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;

      objData.currentPos.lerp(
        target,
        delta * (isFormed ? 0.8 * objData.weight : 0.5)
      );
      group.position.copy(objData.currentPos);

      if (isFormed) {
        const targetLookPos = new THREE.Vector3(
          group.position.x * 2,
          group.position.y + 0.5,
          group.position.z * 2
        );
        group.lookAt(targetLookPos);

        const wobbleX =
          Math.sin(time * objData.wobbleSpeed + objData.wobbleOffset) * 0.05;
        const wobbleZ =
          Math.cos(time * objData.wobbleSpeed * 0.8 + objData.wobbleOffset) *
          0.05;
        group.rotation.x += wobbleX;
        group.rotation.z += wobbleZ;
      } else {
        group.rotation.x += delta * objData.rotationSpeed.x;
        group.rotation.y += delta * objData.rotationSpeed.y;
        group.rotation.z += delta * objData.rotationSpeed.z;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => (
        // @ts-ignore
        <group
          /* @ts-ignore */ key={`photo-${i}`}
          scale={[obj.scale, obj.scale, obj.scale]}
          /* @ts-ignore */ rotation={
            state === "CHAOS" ? obj.chaosRotation : [0, 0, 0]
          }
        >
          {/* @ts-ignore */}
          <group /* @ts-ignore */ position={[0, 0, 0.015]}>
            {/* @ts-ignore */}
            <mesh /* @ts-ignore */ geometry={photoGeometry}>
              {/* @ts-ignore */}
              <meshStandardMaterial
                /* @ts-ignore */ map={textures[obj.textureIndex]}
                /* @ts-ignore */ roughness={0.5}
                /* @ts-ignore */ metalness={0}
                /* @ts-ignore */ emissive={CONFIG.colors.white}
                /* @ts-ignore */ emissiveMap={textures[obj.textureIndex]}
                /* @ts-ignore */ emissiveIntensity={1}
                /* @ts-ignore */ side={THREE.FrontSide}
              />
            </mesh>
            {/* @ts-ignore */}
            <mesh
              /* @ts-ignore */ geometry={borderGeometry}
              /* @ts-ignore */ position={[0, -0.15, -0.01]}
            >
              {/* @ts-ignore */}
              <meshStandardMaterial
                /* @ts-ignore */ color={obj.borderColor}
                /* @ts-ignore */ roughness={0.9}
                /* @ts-ignore */ metalness={0}
                /* @ts-ignore */ side={THREE.FrontSide}
              />
            </mesh>
          </group>
          {/* @ts-ignore */}
          <group
            /* @ts-ignore */ position={[0, 0, -0.015]}
            /* @ts-ignore */ rotation={[0, Math.PI, 0]}
          >
            {/* @ts-ignore */}
            <mesh /* @ts-ignore */ geometry={photoGeometry}>
              {/* @ts-ignore */}
              <meshStandardMaterial
                /* @ts-ignore */ map={textures[obj.textureIndex]}
                /* @ts-ignore */ roughness={0.5}
                /* @ts-ignore */ metalness={0}
                /* @ts-ignore */ emissive={CONFIG.colors.white}
                /* @ts-ignore */ emissiveMap={textures[obj.textureIndex]}
                /* @ts-ignore */ emissiveIntensity={1}
                /* @ts-ignore */ side={THREE.FrontSide}
              />
            </mesh>
            {/* @ts-ignore */}
            <mesh
              /* @ts-ignore */ geometry={borderGeometry}
              /* @ts-ignore */ position={[0, -0.15, -0.01]}
            >
              {/* @ts-ignore */}
              <meshStandardMaterial
                /* @ts-ignore */ color={obj.borderColor}
                /* @ts-ignore */ roughness={0.9}
                /* @ts-ignore */ metalness={0}
                /* @ts-ignore */ side={THREE.FrontSide}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

// --- Component: Christmas Elements ---
const ChristmasElements = ({ state }: { state: "CHAOS" | "FORMED" }) => {
  const count = CONFIG.counts.elements;
  const groupRef = useRef<THREE.Group>(null);

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);
  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(0.5, 16, 16),
    []
  );
  const caneGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8),
    []
  );

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      const h = CONFIG.tree.height;
      const y = Math.random() * h - h / 2;
      const rBase = CONFIG.tree.radius;
      const currentRadius = rBase * (1 - (y + h / 2) / h) * 0.95;
      const theta = Math.random() * Math.PI * 2;

      const targetPos = new THREE.Vector3(
        currentRadius * Math.cos(theta),
        y,
        currentRadius * Math.sin(theta)
      );

      const type = Math.floor(Math.random() * 3);
      let color;
      let scale = 1;
      if (type === 0) {
        color =
          CONFIG.colors.giftColors[
            Math.floor(Math.random() * CONFIG.colors.giftColors.length)
          ];
        scale = 0.8 + Math.random() * 0.4;
      } else if (type === 1) {
        color =
          CONFIG.colors.giftColors[
            Math.floor(Math.random() * CONFIG.colors.giftColors.length)
          ];
        scale = 0.6 + Math.random() * 0.4;
      } else {
        color = Math.random() > 0.5 ? CONFIG.colors.red : CONFIG.colors.white;
        scale = 0.7 + Math.random() * 0.3;
      }

      const rotationSpeed = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2,
      };
      return {
        type,
        chaosPos,
        targetPos,
        color,
        scale,
        currentPos: chaosPos.clone(),
        chaosRotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotationSpeed,
      };
    });
  }, [boxGeometry, sphereGeometry, caneGeometry]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === "FORMED";
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;
      objData.currentPos.lerp(target, delta * 1.5);
      mesh.position.copy(objData.currentPos);
      mesh.rotation.x += delta * objData.rotationSpeed.x;
      mesh.rotation.y += delta * objData.rotationSpeed.y;
      mesh.rotation.z += delta * objData.rotationSpeed.z;
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => {
        let geometry;
        if (obj.type === 0) geometry = boxGeometry;
        else if (obj.type === 1) geometry = sphereGeometry;
        else geometry = caneGeometry;
        // @ts-ignore
        return (
          <mesh
            /* @ts-ignore */ key={`element-${i}`}
            /* @ts-ignore */ geometry={geometry}
            /* @ts-ignore */ rotation={obj.chaosRotation}
            scale={[obj.scale, obj.scale, obj.scale]}
            /* @ts-ignore */ position={[0, 0, 0]}
          >
            {/* @ts-ignore */}
            <meshStandardMaterial
              /* @ts-ignore */ color={obj.color}
              /* @ts-ignore */ roughness={0.3}
              /* @ts-ignore */ metalness={0.4}
              /* @ts-ignore */ emissive={obj.color}
              /* @ts-ignore */ emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// --- Component: Fairy Lights ---
const FairyLights = ({ state }: { state: "CHAOS" | "FORMED" }) => {
  const count = CONFIG.counts.lights;
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.8, 8, 8), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      const h = CONFIG.tree.height;
      const y = Math.random() * h - h / 2;
      const rBase = CONFIG.tree.radius;
      const currentRadius = rBase * (1 - (y + h / 2) / h) + 0.3;
      const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(
        currentRadius * Math.cos(theta),
        y,
        currentRadius * Math.sin(theta)
      );
      const color =
        CONFIG.colors.lights[
          Math.floor(Math.random() * CONFIG.colors.lights.length)
        ];
      const speed = 2 + Math.random() * 3;
      return {
        chaosPos,
        targetPos,
        color,
        speed,
        currentPos: chaosPos.clone(),
        timeOffset: Math.random() * 100,
      };
    });
  }, []);

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === "FORMED";
    const time = stateObj.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;
      objData.currentPos.lerp(target, delta * 2);
      const mesh = child as THREE.Mesh;
      mesh.position.copy(objData.currentPos);
      const intensity =
        (Math.sin(time * objData.speed + objData.timeOffset) + 1) / 2;
      if (mesh.material) {
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          isFormed ? 3 + intensity * 4 : 0;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => (
        // @ts-ignore
        <mesh
          /* @ts-ignore */ key={`light-${i}`}
          scale={[0.15, 0.15, 0.15]}
          /* @ts-ignore */ geometry={geometry}
        >
          {/* @ts-ignore */}
          <meshStandardMaterial
            /* @ts-ignore */ color={obj.color}
            /* @ts-ignore */ emissive={obj.color}
            /* @ts-ignore */ emissiveIntensity={0}
            /* @ts-ignore */ toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// --- Component: Top Star ---
const TopStar = ({ state }: { state: "CHAOS" | "FORMED" }) => {
  const groupRef = useRef<THREE.Group>(null);

  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.3;
    const innerRadius = 0.7;
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      i === 0
        ? shape.moveTo(radius * Math.cos(angle), radius * Math.sin(angle))
        : shape.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    shape.closePath();
    return shape;
  }, []);

  const starGeometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(starShape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
    });
  }, [starShape]);

  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CONFIG.colors.gold,
        emissive: CONFIG.colors.gold,
        emissiveIntensity: 1.5,
        roughness: 0.1,
        metalness: 1,
      }),
    []
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      const targetScale = state === "FORMED" ? 1 : 0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 3
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, CONFIG.tree.height / 2 + 1.8, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh geometry={starGeometry} material={goldMaterial} />
      </Float>
    </group>
  );
};

// --- Loading Screen Component ---
const LoadingScreen = () => {
  return (
    <Html center>
      <div
        style={{
          background: "rgba(0, 0, 0, 0.9)",
          padding: "40px 60px",
          borderRadius: "20px",
          textAlign: "center",
          border: "2px solid #FFD700",
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            color: "#FFD700",
            fontWeight: "bold",
            marginBottom: "20px",
            textShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
          }}
        >
          🎄 Loading Christmas Magic... 🎄
        </div>
        <div
          style={{
            width: "300px",
            height: "8px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FF0000, #00FF00)",
              animation: "shimmer 1.5s infinite",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    </Html>
  );
};

// --- Main Scene Experience ---
const Experience = ({
  sceneState,
  rotationSpeed,
}: {
  sceneState: "CHAOS" | "FORMED";
  rotationSpeed: number;
}) => {
  const controlsRef = useRef<any>(null);
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + rotationSpeed
      );
      controlsRef.current.update();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 60]} fov={45} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={30}
        maxDistance={120}
        autoRotate={rotationSpeed === 0 && sceneState === "FORMED"}
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.7}
      />

      <color attach="background" args={["#000300"]} />
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <Environment preset="night" background={false} />

      <ambientLight intensity={0.4} color="#003311" />
      <pointLight
        position={[30, 30, 30]}
        intensity={100}
        color={CONFIG.colors.warmLight}
      />
      <pointLight
        position={[-30, 10, -30]}
        intensity={50}
        color={CONFIG.colors.gold}
      />
      <pointLight position={[0, -20, 10]} intensity={30} color="#ffffff" />

      <group position={[0, -6, 0]}>
        <Foliage state={sceneState} />
        <Suspense fallback={<LoadingScreen />}>
          <PhotoOrnaments state={sceneState} />
        </Suspense>
        <ChristmasElements state={sceneState} />
        <FairyLights state={sceneState} />
        <TopStar state={sceneState} />
        <Sparkles
          count={300}
          scale={50}
          size={8}
          speed={0.4}
          opacity={0.4}
          color={CONFIG.colors.silver}
        />
      </group>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.1}
          intensity={1.5}
          radius={0.5}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </>
  );
};

// --- Gesture Controller ---
const GestureController = ({
  onGesture,
  onMove,
  onStatus,
  debugMode,
  enabled,
}: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) {
      onStatus("AI DISABLED (Better Performance)");
      return;
    }

    let gestureRecognizer: GestureRecognizer;
    let requestRef: number;

    const setup = async () => {
      onStatus("DOWNLOADING AI...");
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        onStatus("REQUESTING CAMERA...");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            onStatus("AI READY: SHOW HAND");
            predictWebcam();
          }
        } else {
          onStatus("ERROR: CAMERA PERMISSION DENIED");
        }
      } catch (err: any) {
        onStatus(`ERROR: ${err.message || "MODEL FAILED"}`);
      }
    };

    const predictWebcam = () => {
      if (gestureRecognizer && videoRef.current && canvasRef.current) {
        if (videoRef.current.videoWidth > 0) {
          const results = gestureRecognizer.recognizeForVideo(
            videoRef.current,
            Date.now()
          );
          const ctx = canvasRef.current.getContext("2d");
          if (ctx && debugMode) {
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            if (results.landmarks)
              for (const landmarks of results.landmarks) {
                const drawingUtils = new DrawingUtils(ctx);
                drawingUtils.drawConnectors(
                  landmarks,
                  GestureRecognizer.HAND_CONNECTIONS,
                  { color: "#FFD700", lineWidth: 2 }
                );
                drawingUtils.drawLandmarks(landmarks, {
                  color: "#FF0000",
                  lineWidth: 1,
                });
              }
          } else if (ctx && !debugMode)
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );

          if (results.gestures.length > 0) {
            const name = results.gestures[0][0].categoryName;
            const score = results.gestures[0][0].score;
            if (score > 0.4) {
              if (name === "Open_Palm") onGesture("CHAOS");
              if (name === "Closed_Fist") onGesture("FORMED");
              if (debugMode) onStatus(`DETECTED: ${name}`);
            }
            if (results.landmarks.length > 0) {
              const speed = (0.5 - results.landmarks[0][0].x) * 0.15;
              onMove(Math.abs(speed) > 0.01 ? speed : 0);
            }
          } else {
            onMove(0);
            if (debugMode) onStatus("AI READY: NO HAND");
          }
        }
        requestRef = requestAnimationFrame(predictWebcam);
      }
    };
    setup();
    return () => {
      if (requestRef) cancelAnimationFrame(requestRef);
    };
  }, [onGesture, onMove, onStatus, debugMode, enabled]);

  return (
    <>
      <video
        ref={videoRef}
        style={{
          opacity: debugMode ? 0.6 : 0,
          position: "fixed",
          top: 0,
          right: 0,
          width: debugMode ? "320px" : "1px",
          zIndex: debugMode ? 100 : -1,
          pointerEvents: "none",
          transform: "scaleX(-1)",
        }}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: debugMode ? "320px" : "1px",
          height: debugMode ? "auto" : "1px",
          zIndex: debugMode ? 101 : -1,
          pointerEvents: "none",
          transform: "scaleX(-1)",
        }}
      />
    </>
  );
};

// --- Christmas Tree 3D Component ---
export default function ChristmasTree3D() {
  const [sceneState, setSceneState] = useState<"CHAOS" | "FORMED">("CHAOS");
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [_aiStatus, setAiStatus] = useState("INITIALIZING...");
  const [debugMode, _setDebugMode] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false); // AI tắt mặc định để load nhanh

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ toneMapping: THREE.ReinhardToneMapping }}
          shadows
        >
          <Experience sceneState={sceneState} rotationSpeed={rotationSpeed} />
        </Canvas>
      </div>
      <GestureController
        onGesture={setSceneState}
        onMove={setRotationSpeed}
        onStatus={setAiStatus}
        debugMode={debugMode}
        enabled={aiEnabled}
      />

      {/* Control buttons */}
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 1000,
          display: "flex",
          gap: "15px",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => setAiEnabled(!aiEnabled)}
          style={{
            padding: "15px 25px",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            background: aiEnabled
              ? "linear-gradient(135deg, #FF0000, #00FF00)"
              : "linear-gradient(135deg, #666, #999)",
            color: "white",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
          }}
        >
          {aiEnabled ? "🤖 AI: ON" : "🤖 AI: OFF"}
        </button>
      </div>
    </div>
  );
}
