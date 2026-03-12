import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function ImageCarousel({ images, onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  // Se c'è una sola immagine, mostra semplice
  if (images.length === 1) {
    return (
      <div className="relative w-full">
        <img
          src={images[0]}
          alt="Post"
          className="w-full max-h-[600px] object-cover rounded-lg cursor-pointer"
          onClick={() => onImageClick && onImageClick(0)}
        />
      </div>
    );
  }

  // Multiple images: usa Swiper
  return (
    <div className="relative w-full">
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
        className="rounded-lg"
        spaceBetween={0}
        slidesPerView={1}>
        
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img
              src={image}
              alt={`Foto ${index + 1}`}
              className="w-full max-h-[600px] object-cover cursor-pointer"
              onClick={() => onImageClick && onImageClick(index)}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Counter */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export default ImageCarousel;