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

  // Se c'è una sola immagine, mostra senza carousel
  if (images.length === 1) {
    return (
      <div className="relative w-full">
        <img
          src={images[0]}
          alt="Post"
          className="w-full max-h-[600px] object-cover cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => onImageClick && onImageClick(0)}
          loading="lazy"
        />
      </div>
    );
  }

  // Multiple images: usa Swiper carousel
  return (
    <div className="relative w-full select-none">
      <Swiper
        modules={[Navigation, Pagination, Keyboard]}
        navigation
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        keyboard={{
          enabled: true,
        }}
        onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
        className="rounded-lg"
        spaceBetween={0}
        slidesPerView={1}
        loop={false}>
        
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img
              src={image}
              alt={`Foto ${index + 1}`}
              className="w-full max-h-[600px] object-cover cursor-pointer"
              onClick={() => onImageClick && onImageClick(index)}
              loading="lazy"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Counter badge */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-full text-sm font-semibold z-10 pointer-events-none">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export default ImageCarousel;