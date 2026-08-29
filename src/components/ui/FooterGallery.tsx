import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  tag?: string;
  accentColor?: string;
}

const DEFAULT_IMAGES: GalleryImage[] = [
  {
    src: '/images/farmer-seedling.jpg',
    alt: 'Indian farmer inspecting crops in green agricultural field',
    caption: 'Direct Farm Gate',
    tag: 'Farmer',
    accentColor: 'from-green-600/60',
  },
  {
    src: '/images/wholesale_market.jpg',
    alt: 'Vibrant wholesale agricultural mandi and produce crates',
    caption: 'APMC Market Discovery',
    tag: 'Buyer',
    accentColor: 'from-blue-600/60',
  },
  {
    src: '/images/truck_route.jpg',
    alt: 'Rural micro-logistics mini-truck freight on highway',
    caption: 'On-Route Fleet Dispatch',
    tag: 'Transporter',
    accentColor: 'from-amber-600/60',
  },
  {
    src: '/images/buyer-produce.jpg',
    alt: 'Commercial produce sourcing and quality harvest delivery',
    caption: 'Direct Fulfillment',
    tag: 'Commerce',
    accentColor: 'from-emerald-600/60',
  },
];

interface FooterGalleryProps {
  className?: string;
  images?: GalleryImage[];
}

export const FooterGallery: React.FC<FooterGalleryProps> = ({
  className = '',
  images = DEFAULT_IMAGES,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`w-full py-6 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-2">
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                delay: shouldReduceMotion ? 0 : idx * 0.08,
                ease: [0.25, 1, 0.5, 1],
              }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4, scale: 1.02, transition: { duration: 0.2 } }
              }
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/90 shadow-2xs hover:shadow-md transition-shadow cursor-default"
            >
              {/* Image with Lazy Loading */}
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />

              {/* Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${img.accentColor || 'from-black/60'} via-black/20 to-transparent opacity-60 group-hover:opacity-75 transition-opacity`}
              />

              {/* Caption & Tag Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col justify-end text-left">
                {img.tag && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/90 drop-shadow-xs">
                    {img.tag}
                  </span>
                )}
                {img.caption && (
                  <span className="text-[11px] font-semibold text-white leading-tight truncate drop-shadow-xs">
                    {img.caption}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
