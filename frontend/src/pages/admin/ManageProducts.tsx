import { useMemo, useState } from "react";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CategoryCreateDialog from "@/pages/admin/categoryDialogs/CategoryCreateDialog";
import CategoryViewDialog from "@/pages/admin/categoryDialogs/CategoryViewDialog";
import CategoryEditDialog from "@/pages/admin/categoryDialogs/CategoryEditDialog";
import type { AdminCategoryRow } from "@/pages/admin/categoryDialogs/categoryTypes";
import SubCategoryCreateDialog from "@/pages/admin/subcategoryDialogs/SubCategoryCreateDialog";
import SubCategoryViewDialog from "@/pages/admin/subcategoryDialogs/SubCategoryViewDialog";
import SubCategoryEditDialog from "@/pages/admin/subcategoryDialogs/SubCategoryEditDialog";
import type { AdminSubcategoryRow } from "@/pages/admin/subcategoryDialogs/subcategoryTypes";
import ProductCreateDialog from "@/pages/admin/productDialogs/ProductCreateDialog";
import ProductViewDialog from "@/pages/admin/productDialogs/ProductViewDialog";
import ProductEditDialog from "@/pages/admin/productDialogs/ProductEditDialog";
import type { AdminProductRow } from "@/pages/admin/productDialogs/productTypes";
import categoryVegetables from "@/assets/category-vegetables.jpg";
import categoryFruits from "@/assets/category-fruits.jpg";
import categoryBakery from "@/assets/category-bakery.jpg";
import categoryDairy from "@/assets/category-dairy.jpg";
import heroGroceries from "@/assets/hero-groceries.jpg";

type Tab = "category" | "subcategory" | "products";

const navy = "bg-[hsl(222_47%_16%)]";
const thClass = `${navy} text-white text-left text-xs font-semibold uppercase tracking-wide px-4 py-3 border-b border-white/10`;
const sortIcon = <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-70" />;

const categoryRowsInit: AdminCategoryRow[] = [
  { id: 1, name: "Power Bank", image: categoryVegetables, created: "2025-09-20" },
  { id: 2, name: "HP", image: categoryFruits, created: "2025-09-20" },
  { id: 3, name: "Accessories", image: categoryBakery, created: "2025-09-20" },
  { id: 4, name: "Replacement Parts", image: categoryDairy, created: "2025-09-20" },
];

const subcategoryRowsInit: AdminSubcategoryRow[] = [
  { id: 1, subName: "Wireless Power Bank", categoryName: "Power Bank", created: "2025-09-20" },
  { id: 2, subName: "Wired Earphones", categoryName: "HP", created: "2025-09-20" },
  { id: 3, subName: "Phone Cases", categoryName: "Accessories", created: "2025-09-20" },
  { id: 4, subName: "Screen Guards", categoryName: "Accessories", created: "2025-04-25" },
  { id: 5, subName: "Batteries", categoryName: "Replacement Parts", created: "2025-09-20" },
  { id: 6, subName: "Cables", categoryName: "Accessories", created: "2025-04-25" },
  { id: 7, subName: "Chargers", categoryName: "Power Bank", created: "2025-09-20" },
  { id: 8, subName: "Laptop Skins", categoryName: "HP", created: "2025-09-20" },
  { id: 9, subName: "Smartphone & Laptop parts", categoryName: "Replacement Parts", created: "2025-09-20" },
  { id: 10, subName: "Audio Adapters", categoryName: "Accessories", created: "2025-09-20" },
];

const productImages = [categoryVegetables, categoryFruits, categoryBakery, categoryDairy, heroGroceries];

const productDescriptions: string[] = [
  "Compact 10000mAh power bank with 20W fast charging, LED display, and a durable ultra-thin metal housing.",
  "Wired earphones with soft silicone earbuds and noise isolation for clear everyday use on mobile devices.",
  "Braided USB-C to Lightning cable rated for fast charge and daily flex durability.",
  "Display replacement kit with INCELL panel and tools for qualified repair workflows.",
  "Magnetic vent/dash car mount with adjustable arm and full 360° rotation.",
  "OEM-style laptop DC jack harness for compatible mainboards and repair shops.",
  "USB-C wall adapter with foldable prongs and high-efficiency 60W output.",
  "Tempered glass screen protector multipack with 9H hardness and oleophobic coating.",
  "Slim wireless charging pad with anti-slip base and up to 15W compatible output.",
  "Electronics tool kit including precision screwdrivers and nylon spudgers.",
  "Stereo over-ear headphones with a gold-plated 3.5mm plug and padded headband.",
  "Replacement rear camera module, factory tested for fit and image quality.",
  "Silicone sleeve sized for common 10000mAh power banks to reduce scratches.",
  "Dual-port USB car charger with metal shell and broad device compatibility.",
  "USB 3.0 SSD enclosure with tool-free tray and aluminium shell for heat spread.",
  "Heat-resistant soldering and repair mat for bench work and small assemblies.",
  "USB-C docking station with HDMI and expanded port layout for laptops.",
  "Spare flex ribbon for display assemblies; handle ESD-safe during installation.",
];

const productSpecifications: string[] = [
  "Product Name: 20W Metal Ultra-Thin 10000mAh Power Bank\nOutput: 20W USB-C\nCapacity: 10000mAh\nDisplay: LED level indicator",
  "Product Name: Premium Silicone Wired Earphones\nDriver: 10mm\nCable length: 1.2m\nPlug: 3.5mm gold-plated",
  "Length: 2m\nConnectors: USB-C to Lightning\nSheath: Braided nylon\nRating: Fast charge compatible",
  "Panel: INCELL LCD\nIncluded: Basic tool notes (professional install recommended)\nCompatibility: Popular smartphone models",
  "Mount: Magnetic\nRotation: 360°\nArm: Adjustable\nFinish: Anti-scratch pads",
  "Type: DC jack harness\nUse: Laptop repair\nQuality: OEM-style",
  "Ports: USB-C output\nPower: 60W class\nProngs: Foldable",
  "Hardness: 9H\nPack: 2 units\nCoating: Oleophobic",
  "Wireless: Up to 15W compatible devices\nProfile: Slim pad\nBase: Anti-slip",
  "Includes: Screwdrivers, spudgers\nUse: Phones, tablets, laptops",
  "Plug: 3.5mm\nStyle: Over-ear\nCable: Fixed",
  "Type: Rear camera module\nQC: Factory tested",
  "Material: Silicone\nFit: 10000mAh class bricks",
  "Ports: Dual USB\nShell: Metal\nUse: 12V vehicle",
  "Interface: USB 3.0\nInstall: Tool-free\nShell: Aluminium",
  "Material: Silicone / fibre blend\nHeat: Resistant work surface",
  "Ports: USB-C, HDMI, USB-A expansion (layout varies by SKU)\nUse: Laptop desk setup",
  "Type: Display flex ribbon\nNote: ESD handling required",
];

const productsRowsInit: AdminProductRow[] = Array.from({ length: 18 }, (_, i) => {
  const cats = ["Power Bank", "HP", "Accessories", "Replacement Parts"];
  const subs = ["Wireless Power Bank", "Wired Earphones", "Cables", "Smartphone & Laptop parts"];
  const names = [
    "20W Metal Ultra-Thin 10000mAh Fast Charging Power Bank with LED Display",
    "Premium Silicone Wired Earphones with Noise Isolation for Mobile",
    "Braided USB-C to Lightning Cable 2m — Fast Charge Certified",
    "INCELL LCD Display Replacement Kit for Popular Smartphone Models",
    "Magnetic Car Mount with Adjustable Arm and 360° Rotation",
    "Laptop DC Jack Replacement Harness — OEM Compatible",
    "60W USB-C Wall Adapter with Foldable Prongs",
    "Tempered Glass Screen Protector 9H Hardness Pack of 2",
    "Wireless Charging Pad 15W Slim Profile Anti-Slip Base",
    "Tool Kit for Electronics: Screwdriver Set and Spudgers",
    "Stereo Over-Ear Headphones Wired 3.5mm Gold Plated Plug",
    "Replacement Rear Camera Module — Factory Tested",
    "Silicone Protective Sleeve for Power Bank 10000mAh",
    "Dual USB Car Charger Metal Body Quick Charge Support",
    "SSD Enclosure USB 3.0 Tool-Free Aluminium Shell",
    "Precision Soldering Mat Heat Resistant Work Surface",
    "Docking Station USB-C with HDMI and Multi-Port Hub",
    "Spare Flex Cable Ribbon for Display Assembly Replacement",
  ];
  const img = productImages[i % productImages.length];
  const selling = i % 4 === 0 ? 15 : i % 4 === 1 ? 6 : i % 4 === 2 ? 401 : 29 + i;
  const actual = i % 4 === 0 ? 13 : i % 4 === 1 ? 5 : i % 4 === 2 ? 385 : 25 + i;
  return {
    id: i + 1,
    category: cats[i % 4],
    subCategory: subs[i % 4],
    name: names[i] ?? `Product Item ${i + 1} — High Quality Original Equipment`,
    image: img,
    variantImages: [productImages[i % 5], productImages[(i + 1) % 5], productImages[(i + 2) % 5]] as [
      string,
      string,
      string,
    ],
    stock: i % 3 === 0 ? 10 : i % 3 === 1 ? 58 : 12 + (i % 200),
    price: selling,
    actualPrice: actual,
    manufacturer: i % 2 === 0 ? "Testing" : "Apple",
    quality: i % 2 === 0 ? "OEM" : "INCELL",
    description: productDescriptions[i] ?? "",
    specification: productSpecifications[i] ?? "",
  };
});

function ActionButtons({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={onView}
        className="h-8 w-8 rounded-md bg-[hsl(222_47%_16%)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="h-8 w-8 rounded-md bg-sky-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="h-8 w-8 rounded-md bg-orange-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

const ManageProducts = () => {
  const [tab, setTab] = useState<Tab>("category");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<AdminCategoryRow[]>(categoryRowsInit);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [viewCategoryOpen, setViewCategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryRow | null>(null);
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [viewSubOpen, setViewSubOpen] = useState(false);
  const [editSubOpen, setEditSubOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<AdminSubcategoryRow | null>(null);
  const [subcategories, setSubcategories] = useState<AdminSubcategoryRow[]>(subcategoryRowsInit);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [viewProductOpen, setViewProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductRow | null>(null);
  const [products, setProducts] = useState<AdminProductRow[]>(productsRowsInit);

  const tabTitle = tab === "category" ? "Category" : tab === "subcategory" ? "Sub Category" : "Products";

  const categoryOptions = useMemo(() => categories.map((c) => c.name), [categories]);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const filteredSubs = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return subcategories;
    return subcategories.filter((s) => s.subName.toLowerCase().includes(q) || s.categoryName.toLowerCase().includes(q));
  }, [subcategories, search]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.quality.toLowerCase().includes(q),
    );
  }, [products, search]);

  const total = tab === "category" ? filteredCategories.length : tab === "subcategory" ? filteredSubs.length : filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const categorySlice = filteredCategories.slice(start, start + pageSize);
  const subSlice = filteredSubs.slice(start, start + pageSize);
  const productSlice = filteredProducts.slice(start, start + pageSize);

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setPage(1);
        setSearch("");
      }}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        tab === id ? `${navy} text-white` : "bg-muted text-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <CategoryCreateDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onCreate={({ name, image }) => {
          const img = image || categoryVegetables;
          const row: AdminCategoryRow = {
            id: Date.now(),
            name,
            image: img,
            created: new Date().toISOString().slice(0, 10),
          };
          setCategories((c) => [...c, row]);
          toast.success("Category created");
        }}
      />
      <CategoryViewDialog open={viewCategoryOpen} onOpenChange={setViewCategoryOpen} category={selectedCategory} />
      <CategoryEditDialog
        open={editCategoryOpen}
        onOpenChange={setEditCategoryOpen}
        category={selectedCategory}
        onUpdate={(id, { name, image }) => {
          setCategories((c) => c.map((row) => (row.id === id ? { ...row, name, image } : row)));
          toast.success("Category updated");
        }}
      />
      <SubCategoryCreateDialog
        open={createSubOpen}
        onOpenChange={setCreateSubOpen}
        categoryOptions={categoryOptions}
        onCreate={({ subName, categoryName }) => {
          const row: AdminSubcategoryRow = {
            id: Date.now(),
            subName,
            categoryName,
            created: new Date().toISOString().slice(0, 10),
          };
          setSubcategories((s) => [...s, row]);
          toast.success("Sub category created");
        }}
      />
      <SubCategoryViewDialog open={viewSubOpen} onOpenChange={setViewSubOpen} subcategory={selectedSubcategory} />
      <SubCategoryEditDialog
        open={editSubOpen}
        onOpenChange={setEditSubOpen}
        categoryOptions={categoryOptions}
        subcategory={selectedSubcategory}
        onUpdate={(id, { subName, categoryName }) => {
          setSubcategories((s) => s.map((row) => (row.id === id ? { ...row, subName, categoryName } : row)));
          toast.success("Sub category updated");
        }}
      />
      <ProductCreateDialog
        open={createProductOpen}
        onOpenChange={setCreateProductOpen}
        categoryOptions={categoryOptions}
        subcategories={subcategories}
        fallbackMainImage={categoryVegetables}
        onCreate={(data) => {
          const row: AdminProductRow = { ...data, id: Date.now() };
          setProducts((p) => [...p, row]);
          toast.success("Product created");
        }}
      />
      <ProductViewDialog open={viewProductOpen} onOpenChange={setViewProductOpen} product={selectedProduct} />
      <ProductEditDialog
        open={editProductOpen}
        onOpenChange={setEditProductOpen}
        categoryOptions={categoryOptions}
        subcategories={subcategories}
        product={selectedProduct}
        onUpdate={(id, data) => {
          setProducts((p) => p.map((row) => (row.id === id ? { ...row, ...data } : row)));
          toast.success("Product updated");
        }}
      />

    <div className="rounded-xl bg-card border border-border/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto ml-auto">
          {tabBtn("category", "Category")}
          {tabBtn("subcategory", "Sub Category")}
          {tabBtn("products", "Products")}
        </div>
      </div>

      <div className="p-5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold text-foreground">{tabTitle}</h3>
          {tab === "category" && (
            <button
              type="button"
              onClick={() => setCreateCategoryOpen(true)}
              className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity w-fit"
            >
              Create Category
            </button>
          )}
          {tab === "subcategory" && (
            <button
              type="button"
              onClick={() => setCreateSubOpen(true)}
              className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity w-fit"
            >
              Create Sub Category
            </button>
          )}
          {tab === "products" && (
            <button
              type="button"
              onClick={() => setCreateProductOpen(true)}
              className="rounded-md bg-[#000533] text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity w-fit"
            >
              Create Product
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-border rounded-md px-2 py-1.5 bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="admin-table-search" className="text-muted-foreground whitespace-nowrap">
              Search:
            </label>
            <input
              id="admin-table-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="border border-border rounded-md px-3 py-1.5 min-w-[200px] bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              {tab === "category" && (
                <tr>
                  <th className={thClass}>
                    #{sortIcon}
                  </th>
                  <th className={thClass}>
                    Category Name{sortIcon}
                  </th>
                  <th className={thClass}>
                    Image{sortIcon}
                  </th>
                  <th className={thClass}>
                    Created{sortIcon}
                  </th>
                  <th className={`${thClass} text-center`}>
                    Action{sortIcon}
                  </th>
                </tr>
              )}
              {tab === "subcategory" && (
                <tr>
                  <th className={thClass}>#{sortIcon}</th>
                  <th className={thClass}>Sub Category Name{sortIcon}</th>
                  <th className={thClass}>Category Name{sortIcon}</th>
                  <th className={thClass}>Created{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Action{sortIcon}</th>
                </tr>
              )}
              {tab === "products" && (
                <tr>
                  <th className={thClass}>#{sortIcon}</th>
                  <th className={thClass}>Category{sortIcon}</th>
                  <th className={thClass}>Sub Category{sortIcon}</th>
                  <th className={thClass}>Product Name{sortIcon}</th>
                  <th className={thClass}>Image{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Stock{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Price{sortIcon}</th>
                  <th className={thClass}>Manufacturer{sortIcon}</th>
                  <th className={thClass}>Quality{sortIcon}</th>
                  <th className={`${thClass} text-center`}>Action{sortIcon}</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tab === "category" &&
                categorySlice.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border ${idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{start + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3">
                      <img src={row.image} alt={row.name} className="h-12 w-12 rounded object-cover border border-border" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.created}</td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        onView={() => {
                          setSelectedCategory(row);
                          setViewCategoryOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedCategory(row);
                          setEditCategoryOpen(true);
                        }}
                        onDelete={() => {
                          setCategories((c) => c.filter((x) => x.id !== row.id));
                          toast.success("Category removed");
                        }}
                      />
                    </td>
                  </tr>
                ))}
              {tab === "subcategory" &&
                subSlice.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border ${idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{start + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.subName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.categoryName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.created}</td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        onView={() => {
                          setSelectedSubcategory(row);
                          setViewSubOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedSubcategory(row);
                          setEditSubOpen(true);
                        }}
                        onDelete={() => {
                          setSubcategories((s) => s.filter((x) => x.id !== row.id));
                          toast.success("Sub category removed");
                        }}
                      />
                    </td>
                  </tr>
                ))}
              {tab === "products" &&
                productSlice.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-border ${idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{start + idx + 1}</td>
                    <td className="px-4 py-3 text-foreground">{r.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.subCategory}</td>
                    <td className="px-4 py-3 text-foreground max-w-[240px]">{r.name}</td>
                    <td className="px-4 py-3">
                      <img src={r.image} alt={r.name} className="h-12 w-12 rounded object-cover border border-border" />
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{r.stock}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{r.price}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.manufacturer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.quality}</td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        onView={() => {
                          setSelectedProduct(r);
                          setViewProductOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedProduct(r);
                          setEditProductOpen(true);
                        }}
                        onDelete={() => {
                          setProducts((p) => p.filter((x) => x.id !== r.id));
                          toast.success("Product removed");
                        }}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-muted-foreground">
          <p>
            Showing {total === 0 ? 0 : start + 1} to {Math.min(start + pageSize, total)} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-border bg-background disabled:opacity-40 hover:bg-muted/50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={`min-w-[2rem] px-2 py-1.5 rounded text-sm font-medium ${
                  num === safePage ? `${navy} text-white` : "border border-border bg-background hover:bg-muted/50"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded border border-border bg-background disabled:opacity-40 hover:bg-muted/50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ManageProducts;
