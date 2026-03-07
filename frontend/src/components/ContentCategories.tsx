import { Music, BookOpen, BookImage } from "lucide-react";
import { Card } from "@/components/ui/card";
import musicIcon from "@/assets/music-icon.jpg";
import booksIcon from "@/assets/books-icon.jpg";
import comicsIcon from "@/assets/comics-icon.jpg";
import Image from "next/image";

const categories = [
  {
    icon: Music,
    title: "Músicas",
    description: "Cantigas, músicas educativas e playlists para cada momento do dia.",
    image: musicIcon,
    color: "primary",
  },
  {
    icon: BookOpen,
    title: "Audiobooks",
    description: "Histórias encantadoras, contos de fadas e clássicos da literatura narrados para ouvir.",
    image: booksIcon,
    color: "success",
  },
];

const ContentCategories = () => {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Explore nosso catálogo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma seleção cuidadosa de músicas e audiobooks para inspirar e entreter.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-smooth cursor-pointer"
              >
                <div className="absolute inset-0 gradient-card opacity-0 group-hover:opacity-100 transition-smooth" />
                
                <div className="relative p-8 space-y-6">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-soft">
                    <Image 
                      src={category.image} 
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-${category.color}/10`}>
                        <Icon className={`w-6 h-6 text-${category.color}`} />
                      </div>
                      <h3 className="text-2xl font-bold">{category.title}</h3>
                    </div>
                    
                    <p className="text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContentCategories;
