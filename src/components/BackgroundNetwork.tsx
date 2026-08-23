import React, { useEffect, useRef } from 'react';

interface BackgroundNetworkProps {
  isDark?: boolean;
}

export const BackgroundNetwork: React.FC<BackgroundNetworkProps> = ({ isDark = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Logistics Hub Nodes
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      pulseSpeed: number;
      pulseOffset: number;
      type: 'producer' | 'hub' | 'market';
    }

    interface Packet {
      fromNode: number;
      toNode: number;
      progress: number;
      speed: number;
      color: string;
    }

    let nodes: Node[] = [];
    let packets: Packet[] = [];

    const initNodes = () => {
      nodes = [];
      packets = [];
      const nodeCount = Math.min(Math.floor((width * height) / 28000), 45);

      for (let i = 0; i < nodeCount; i++) {
        const types: ('producer' | 'hub' | 'market')[] = ['producer', 'hub', 'market'];
        const type = types[Math.floor(Math.random() * types.length)];
        const baseRadius = type === 'hub' ? 3.5 : 2.2;

        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: baseRadius,
          baseRadius,
          pulseSpeed: 0.02 + Math.random() * 0.02,
          pulseOffset: Math.random() * Math.PI * 2,
          type,
        });
      }

      // Initialize moving logistics cargo packets along routes
      for (let i = 0; i < 8; i++) {
        if (nodes.length > 2) {
          const from = Math.floor(Math.random() * nodes.length);
          let to = Math.floor(Math.random() * nodes.length);
          while (to === from) {
            to = Math.floor(Math.random() * nodes.length);
          }
          packets.push({
            fromNode: from,
            toNode: to,
            progress: Math.random(),
            speed: 0.003 + Math.random() * 0.004,
            color: Math.random() > 0.5 ? '#10B981' : '#38BDF8',
          });
        }
      }
    };

    initNodes();

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );

      if (isDark) {
        bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
        bgGrad.addColorStop(0.5, 'rgba(10, 15, 29, 0.7)');
        bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      } else {
        bgGrad.addColorStop(0, 'rgba(241, 245, 249, 0.6)');
        bgGrad.addColorStop(1, 'rgba(248, 250, 252, 0.95)');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle logistics connection routes
      const maxDistance = Math.min(width, height) * 0.28;

      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Update positions
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        // Bounce from boundaries
        if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1;
        if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1;

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (isDark ? 0.16 : 0.12);
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            
            // Curved logistic route trajectory
            const midX = (nodeA.x + nodeB.x) / 2 + Math.sin(time + i) * 6;
            const midY = (nodeA.y + nodeB.y) / 2 + Math.cos(time + j) * 6;
            ctx.quadraticCurveTo(midX, midY, nodeB.x, nodeB.y);

            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${alpha})`
              : `rgba(14, 165, 233, ${alpha * 1.2})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw active transit cargo packets
      packets.forEach((packet) => {
        packet.progress += packet.speed;
        if (packet.progress >= 1) {
          packet.progress = 0;
          packet.fromNode = Math.floor(Math.random() * nodes.length);
          packet.toNode = Math.floor(Math.random() * nodes.length);
        }

        const a = nodes[packet.fromNode];
        const b = nodes[packet.toNode];
        if (a && b) {
          const px = a.x + (b.x - a.x) * packet.progress;
          const py = a.y + (b.y - a.y) * packet.progress;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = packet.color;
          ctx.shadowColor = packet.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw logistics hub nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulseOffset) * 0.6;
        const currentRadius = Math.max(1.5, node.baseRadius + pulse);

        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);

        const nodeColor =
          node.type === 'producer'
            ? isDark
              ? '#10B981'
              : '#059669'
            : node.type === 'hub'
            ? isDark
              ? '#38BDF8'
              : '#0284C7'
            : isDark
            ? '#A78BFA'
            : '#7C3AED';

        ctx.fillStyle = nodeColor;
        ctx.fill();

        // Node glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = nodeColor;
        ctx.globalAlpha = isDark ? 0.25 : 0.18;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full block opacity-75 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      {/* Subtle top and bottom radial vignettes */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[600px] h-[300px] bg-sky-500/10 dark:bg-sky-500/15 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
};
