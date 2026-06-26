import Image from "next/image";
import BlogImage1 from "@/assets/images/blog-1.png";
import BlogCard from "./blog-card";
import BlogImage2 from "@/assets/images/blog-2.png";

const BlogHero = () => {
  return (
    <section className=" w-full px-4 md:px-0">
      <div className=" container w-full flex flex-col items-center pt-12">
        <div className=" inline-flex bg-white border rounded-full shadow-md items-center justify-center py-2 px-4">
          <p className=" text-lg">Blog Post</p>
        </div>
        <h2 className=" text-5xl md:text-7xl font-medium text-center mt-6 mx-auto">
          Webflow vs. Wix: Unraveling the Best Website Builder
        </h2>
        <p className=" text-lg opacity-70 mt-4 md:mt-6">
          29 November 2024 • 08:45 AM
        </p>
      </div>
      <div className="md:max-w-7xl w-full relative h-auto aspect-video md:aspect-auto md:h-[44rem] mx-auto mt-12">
        <Image
          quality={100}
          fill
          src={BlogImage1}
          className=" object-cover rounded-xl md:rounded-[2rem]"
          alt="Blog hero image"
        />
      </div>
      <div className=" container w-full md:px-40 py-12 px-0">
        <p className=" text-xl text-black opacity-70 mb-10">
          Radar V1 is designed around explicit capture, approved knowledge, and
          one cited guidance card at a time. The goal is to support complex
          customer conversations without turning the live call into another
          dashboard.
        </p>
        <h3 className=" text-4xl font-medium text-black">Webflow</h3>
        <p className=" text-xl text-black opacity-70 mt-4">
          Webflow-style launch speed is useful for marketing surfaces, but Radar
          production paths need stronger controls: tenant isolation, permission
          checks, audit trails, retention jobs, and source approval before
          customer data is used.
        </p>
        <p className=" text-xl text-black opacity-70 mt-4">
          That separation keeps product pages flexible while the application
          shell remains strict about real data, empty states, and unsupported
          answer handling.
        </p>

        <h3 className=" text-4xl font-medium text-black mt-10">Framer</h3>
        <p className=" text-xl text-black opacity-70 mt-4">
          Framer-style interaction can make review and source workflows feel
          polished, but the core assistance path should stay quiet and
          predictable during customer calls.
        </p>
        <p className=" text-xl text-black opacity-70 mt-4">
          Admins need richer surfaces for approvals, replay, gaps, freshness,
          analytics, settings, and audit history.
        </p>
        <p className=" text-xl text-black opacity-70 mt-4">
          The live overlay should show only what is needed: capture state,
          pause/end controls, and a single cited card when the system has enough
          evidence to help.
        </p>
      </div>

      <div className=" max-w-7xl mx-auto py-20">
        <h1 className=" text-4xl md:text-5xl text-black font-medium mb-6">
          Next Read
        </h1>
        <BlogCard img={BlogImage2} />
      </div>
    </section>
  );
};

export default BlogHero;
