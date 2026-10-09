import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * All images imported directly from Cloudinary account 'dbj0pmqr'
 * Strictly filtered to images only (no videos).
 * Aspect ratios: 3:4 for vertical portraits, 4:3 for landscape.
 */
export const CLOUDINARY_GALLERY_IMAGES = [
  {
    id: 'IMG_2815',
    publicId: 'IMG_2815',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_4:3,g_auto,w_1200,q_auto,f_auto/v1791574940/IMG_2815.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574940/IMG_2815.avif',
    aspectRatio: '4:3',
    width: 6000,
    height: 4000,
    alt: 'Boston Halloween costume celebration party'
  },
  {
    id: 'IMG_2849',
    publicId: 'IMG_2849',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574940/IMG_2849.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574940/IMG_2849.avif',
    aspectRatio: '3:4',
    width: 4000,
    height: 6000,
    alt: 'Halloween party guest in festive costume'
  },
  {
    id: 'IMG_2888',
    publicId: 'IMG_2888',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574940/IMG_2888.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574940/IMG_2888.avif',
    aspectRatio: '3:4',
    width: 4000,
    height: 6000,
    alt: 'Packed nightlife crowd and spooky lighting'
  },
  {
    id: 'IMG_2650',
    publicId: 'IMG_2650',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574939/IMG_2650.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574939/IMG_2650.avif',
    aspectRatio: '3:4',
    width: 4000,
    height: 6000,
    alt: 'Halloween party celebration in Boston'
  },
  {
    id: 'DSC03004',
    publicId: 'DSC03004',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574939/DSC03004.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574939/DSC03004.avif',
    aspectRatio: '3:4',
    width: 5304,
    height: 7952,
    alt: 'Boston Halloween nightlife experience'
  },
  {
    id: 'DSC02962',
    publicId: 'DSC02962',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574938/DSC02962.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574938/DSC02962.avif',
    aspectRatio: '3:4',
    width: 5304,
    height: 7952,
    alt: 'Costume party celebration on the dance floor'
  },
  {
    id: 'DSC03109',
    publicId: 'DSC03109',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574938/DSC03109.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574938/DSC03109.avif',
    aspectRatio: '3:4',
    width: 5304,
    height: 7952,
    alt: 'Halloween festival and masquerade night'
  },
  {
    id: 'DSC03316',
    publicId: 'DSC03316',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574938/DSC03316.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574938/DSC03316.avif',
    aspectRatio: '3:4',
    width: 5304,
    height: 7952,
    alt: 'Halloween club lights and laser effects'
  },
  {
    id: 'DSC03250',
    publicId: 'DSC03250',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574938/DSC03250.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574938/DSC03250.avif',
    aspectRatio: '3:4',
    width: 3448,
    height: 5168,
    alt: 'Party guests in creative Halloween costumes'
  },
  {
    id: 'DSC03175',
    publicId: 'DSC03175',
    url: 'https://res.cloudinary.com/dbj0pmqr/image/upload/c_fill,ar_3:4,g_auto,w_1000,q_auto,f_auto/v1791574938/DSC03175.avif',
    rawUrl: 'https://res.cloudinary.com/dbj0pmqr/image/upload/v1791574938/DSC03175.avif',
    aspectRatio: '3:4',
    width: 3448,
    height: 5168,
    alt: 'Boston Halloween nightlife party'
  }
];

export default function GallerySection() {
  const [images, setImages] = useState(CLOUDINARY_GALLERY_IMAGES);
  const [isExpanded, setIsExpanded] = useState(false);
  const [columnCount, setColumnCount] = useState(4);

  // Responsive column count listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumnCount(1);
      } else if (window.innerWidth < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync with live Cloudinary API endpoint if server is online
  useEffect(() => {
    let isMounted = true;
    fetch('/api/gallery')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch(() => {
        // Fallback to static Cloudinary verified list
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Show all 10 images initially; expand if more exist from Cloudinary API
  const visibleImages = isExpanded ? images : images.slice(0, 10);
  const hasMore = images.length > 10;

  // Distribute images into columns by shortest column height to eliminate any gaps!
  // This ensures the space beneath shorter 4:3 images gets filled down-by-down with subsequent images.
  const columns = Array.from({ length: columnCount }, () => []);
  const colHeights = Array.from({ length: columnCount }, () => 0);

  visibleImages.forEach((item) => {
    let shortestIdx = 0;
    for (let i = 1; i < columnCount; i++) {
      if (colHeights[i] < colHeights[shortestIdx]) {
        shortestIdx = i;
      }
    }
    columns[shortestIdx].push(item);
    // 3:4 is taller (1.33), 4:3 is shorter (0.75)
    colHeights[shortestIdx] += item.aspectRatio === '4:3' ? 0.75 : 1.33;
  });

  return (
    <section className="gallery-section-container" aria-label="Halloween Nightlife Gallery">
      {/* Section Header */}
      <div className="gallery-section-header">
        <div className="gallery-kicker-badge">
          <span className="kicker-sparkle">✦</span>
          <span>BOSTON HALLOWEEN NIGHTLIFE</span>
          <span className="kicker-sparkle">✦</span>
        </div>
        <h2 className="gallery-section-title">Past Celebrations</h2>
        <p className="gallery-section-subtitle">
          A glimpse into the energy, costumes, and unforgettable moments from Boston’s premier Halloween parties.
        </p>
      </div>

      {/* Balanced Masonry Columns (Zero empty gaps, fills down-by-down) */}
      <div className="gallery-masonry-wrapper" role="region" aria-label="Photo gallery grid">
        {columns.map((colItems, colIdx) => (
          <div key={`col-${colIdx}`} className="gallery-masonry-column">
            {colItems.map((item) => {
              const arClass = item.aspectRatio === '4:3' ? 'ar-4-3' : 'ar-3-4';
              return (
                <div key={item.id} className={`gallery-card-tile ${arClass}`}>
                  <img
                    src={item.url}
                    alt={item.alt || 'Boston Halloween Celebration'}
                    className="gallery-image"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* View More Button Centered on Bottom (only if > 10 images) */}
      {hasMore && (
        <div className="gallery-action-footer">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-gallery-view-more"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Show fewer photos' : 'View more gallery photos'}
          >
            <span>{isExpanded ? 'Show Less' : `View More (${images.length - 10} More)`}</span>
            <ChevronDown
              size={16}
              className={`view-more-chevron ${isExpanded ? 'is-rotated' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </section>
  );
}
