import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import ProductCard from "@/components/common/ProductCard";
import { products } from "@/data/mockData";

const FeaturedProducts = () => (
  <SectionWrapper className="bg-muted/50">
    <SectionHeading title="Featured Products" subtitle="Handpicked fresh items just for you" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  </SectionWrapper>
);

export default FeaturedProducts;
