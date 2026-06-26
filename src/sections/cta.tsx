import Image from "next/image";

import ctaImage from "@/assets/images/cta-img.png";
import { Button } from "@/components/ui/button";

const Cta = () => {
  return (
    <section className=" pb-40 max-w-7xl w-full mx-auto px-4 md:px-0">
      <div className="w-full flex flex-col md:flex-row bg-[#00ADE7] rounded-[2rem] shadow-sm md:h-[36rem] overflow-clip justify-between gap-20 px-4 md:px-12 md:pb-12 md:pt-12 mx-auto">
        <div className="flex flex-col items-start w-full md:w-[80%] mt-14">
          <h2 className=" text-start text-5xl md:text-6xl font-medium text-white">
            Boost productivity & streamline your workflow
          </h2>
          <p className=" text-start text-lg mt-6 text-white/80">
            Sign up for a free trial and take control of your productivity.
          </p>

          <div className=" w-full flex flex-col gap-4 mt-12">
            <Button className=" w-full" variant="secondary">
              Start Free Trial Now
            </Button>
            <Button className=" w-full" variant="transparent">
              Secure, no credit card required.
            </Button>
          </div>
        </div>
        <div className=" w-full">
          <div className=" relative w-full md:w-[150%] scale-[1.35] md:scale-125 h-auto aspect-video md:h-[38rem]">
            <Image
              fill
              className=" object-contain"
              src={ctaImage}
              alt="Product showcase"
              quality={100}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
