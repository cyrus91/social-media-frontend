import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function ImageCarousel({ images, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  // Se c'è una sola immagine
  if (images.length === 1) {
    return (
      <div className="relative w-full">
        {/* 
          ✅ ASPECT RATIO OTTIMALE:
          - Mobile: 4:3 (più verticale, risparmia scroll)
          - Desktop: 16:9 (più orizzontale, usa spazio schermo)
        */}
        <div className="relative w-full aspect-[4/3] md:aspect-video overflow-hidden bg-gray-900">
          <img
            src={images[0]}
            alt="Post"
            className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-transform hover:scale-[1.02] active:scale-100"
            onClick={() => onImageClick && onImageClick(0)}
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // Multiple images: usa Swiper carousel
  return (
    <div className="relative w-full select-none">
      {/* 
        ✅ ASPECT RATIO OTTIMALE:
        - Mobile: 4:3 (compatto ma leggibile)
        - Desktop: 16:9 (cinematografico)
      */}
      <div className="relative w-full aspect-[4/3] md:aspect-video overflow-hidden bg-gray-900">
        <Swiper
          modules={[Navigation, Pagination, Keyboard]}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            el: '.swiper-pagination-custom',
          }}
          keyboard={{
            enabled: true,
          }}
          onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          className="h-full w-full"
          spaceBetween={0}
          slidesPerView={1}
          loop={false}
          grabCursor={true}
          touchRatio={1.5}>
          
          {images.map((image, index) => (
            <SwiperSlide key={index} className="h-full">
              <img
                src={image}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer select-none"
                onClick={() => onImageClick && onImageClick(index)}
                loading="lazy"
                draggable={false}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons (migliore UX) */}
        <button 
          className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100 hidden md:block"
          aria-label="Foto precedente">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100 hidden md:block"
          aria-label="Foto successiva">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Custom Pagination */}
        <div className="swiper-pagination-custom absolute bottom-3 left-1/2 -translate-x-1/2 z-20"></div>
      </div>

      {/* Counter badge */}
      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold z-20 pointer-events-none shadow-lg">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export default ImageCarousel;