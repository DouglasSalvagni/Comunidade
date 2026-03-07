"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Music, 
  Heart, 
  BookOpen, 
  Sparkles, 
  Smile, 
  Star, 
  Headphones, 
  Baby, 
  Moon,
  Lightbulb,
  GraduationCap
} from "lucide-react";

type Benefit = {
  text: string;
  source: string;
  link: string;
  icon: React.ElementType;
};

const ICONS = [
  Brain, Music, Heart, BookOpen, Sparkles, Smile, Star, Headphones, Baby, Moon, Lightbulb, GraduationCap
];

const BENEFITS: Benefit[] = [
    {
        text: 'Ouvir música desde bebê estimula áreas do cérebro responsáveis pela linguagem e fala.',
        source: 'UNICEF',
        link: 'https://www.unicef.org/parenting/child-development/baby-music-soundtrack-to-development',
        icon: Brain,
    },
    {
        text: 'Músicas de ninar ajudam a regular o sono do bebê e a reduzir o nível de estresse.',
        source: 'Sleep Foundation',
        link: 'https://www.parents.com/parents-say-music-helps-their-babies-sleep-better-heres-what-to-try-11803447',
        icon: Moon,
    },
    {
        text: 'Crianças expostas à música desenvolvem melhor a coordenação motora e o raciocínio lógico.',
        source: 'Harvard Health',
        link: 'https://www.health.harvard.edu/blog/why-is-music-good-for-the-brain-2020100721062',
        icon: GraduationCap,
    },
    {
        text: 'Audiobooks estimulam a imaginação e a criatividade, permitindo que a criança crie suas próprias imagens mentais.',
        source: 'Scholastic',
        link: 'https://www.scarymommy.com/lifestyle/are-audiobooks-good-for-kids-brain-development',
        icon: Sparkles,
    },
    {
        text: 'Educação musical está associada a melhor desempenho cognitivo entre 5 e 14 anos.',
        source: 'Rast Musicology Journal (2025)',
        link: 'https://dergipark.org.tr/en/pub/rastmd/issue/90359/1611521',
        icon: Lightbulb,
    },
    {
        text: 'Musicalização melhora memória, atenção e concentração.',
        source: 'UNESC (2024)',
        link: 'https://periodicos.unesc.net/ojs/index.php/Inovasaude/article/view/8566',
        icon: Brain,
    },
    {
        text: 'Música reduz estresse e melhora o humor infantil.',
        source: 'Humanium',
        link: 'https://www.humanium.org/en/the-power-of-music-on-childrens-well-being/',
        icon: Smile,
    },
    {
        text: 'Tocar instrumentos desenvolve coordenação motora fina e percepção auditiva.',
        source: 'UNICEF',
        link: 'https://www.unicef.org/parenting/child-development/baby-music-soundtrack-to-development',
        icon: Music,
    },
    {
        text: 'Audiobooks ajudam crianças a aprender vocabulário, pronúncia e reconhecimento de palavras novas.',
        source: 'Collaborative for Children',
        link: 'https://collabforchildren.org/resources-for-families/resource-library/the-benefits-of-audiobooks-for-helping-children-learn/',
        icon: BookOpen,
    },
    {
        text: 'Ouvir histórias em áudio expõe crianças a vocabulário mais rico e variado do que o cotidiano, ajudando no desenvolvimento da linguagem.',
        source: 'The 74',
        link: 'https://www.the74million.org/article/want-to-spur-your-childs-intellectual-development-use-audiobooks-instead-of-videos/',
        icon: Headphones,
    },
    {
        text: 'A escuta de audiobooks permite que crianças reconheçam palavras desconhecidas e aprendam sua pronúncia e uso correto em frases narrativas.',
        source: 'Words for Life',
        link: 'https://wordsforlife.org.uk/activities/what-are-the-benefits-of-listening-to-audiobooks-as-a-family-at-home/',
        icon: BookOpen,
    },
    {
        text: 'Audiobooks podem expandir o vocabulário e melhorar a fluência de leitura e escuta, especialmente para crianças que ainda não conseguem ler de forma independente.',
        source: 'Bookmark Reading',
        link: 'https://www.bookmarkreading.org/news/5-ways-audiobooks-can-help-children-develop-a-buzz-for-reading',
        icon: Star,
    },
    {
        text: 'Ouvir audiolivros melhora a compreensão auditiva e favorece a interpretação de narrativas e linguagem falada.',
        source: 'TADQIQOTLAR (2025)',
        link: 'https://journalss.org/index.php/tad/article/view/4336',
        icon: Headphones,
    },
    {
        text: 'Audiolivros ajudam no desenvolvimento da escuta ativa e compreensão de sentido, beneficiando quem tem dificuldades com leitura tradicional.',
        source: 'Elefante Letrado',
        link: 'https://blog.elefanteletrado.com.br/beneficios-audiolivros-inclusao-sala-de-aula/',
        icon: BookOpen,
    },
    {
        text: 'Estudos mostram que o uso de audiolivros pode aumentar as habilidades de compreensão auditiva e compreensão de texto em contextos educativos.',
        source: 'Educational Psychology Review (2025)',
        link: 'https://ecc-cornerstone.com/2025/05/01/learning-through-listening-exploring-the-legitimacy-of-audiobooks-in-education/',
        icon: GraduationCap,
    },
    {
        text: 'Ouvir audiolivros desenvolve a escuta ativa e a capacidade de manter a atenção por períodos mais longos, ao exigir que a criança acompanhe a narrativa sem estímulos visuais.',
        source: 'Phys.org',
        link: 'https://phys.org/news/2024-07-spur-child-intellectual-audiobooks-videos.html',
        icon: Brain,
    },
    {
        text: 'Histórias em áudio promovem foco e concentração — crianças precisam manter o enredo em mente, seguir personagens e acompanhar sequências narrativas, o que treina a atenção sustentada.',
        source: 'Helios Kids',
        link: 'https://helioskids.com/en/why-listening-to-audio-stories-improves-concentration-and-vocabulary/',
        icon: Lightbulb,
    },
    {
        text: "Sem imagens visuais, audiobooks incentivam a criança a imaginar cenários, personagens e ambientes por conta própria, estimulando a imaginação e o “teatro mental”.",
        source: "The 74",
        link: "https://www.the74million.org/article/want-to-spur-your-childs-intellectual-development-use-audiobooks-instead-of-videos/",
        icon: Sparkles,
    },
    {
        text: "Ouvir histórias narradas estimula imaginação e criatividade, pois obriga a criança a formar imagens mentais e representar internamente cenas e personagens — algo que vídeos e imagens prontas não exigem.",
        source: "Bookmark Reading",
        link: "https://www.bookmarkreading.org/news/5-ways-audiobooks-can-help-children-develop-a-buzz-for-reading",
        icon: Brain,
    },
    {
        text: "Ouvir histórias narradas — como em audiolivros — permite que crianças entrem em contato com personagens, dilemas e emoções variadas, o que ajuda no desenvolvimento da empatia e compreensão de emoções complexas.",
        source: "The Imagine Project",
        link: "https://theimagineproject.org/how-audiobooks-can-help-improve-childrens-literacy-and-sel/",
        icon: Heart,
    },
    {
        text: "Histórias narradas e contação de histórias favorecem a percepção de estados emocionais e relações sociais das personagens, o que exerce a empatia e o entendimento emocional nas crianças.",
        source: "Frontiers",
        link: "https://www.frontiersin.org/articles/10.3389/fpsyg.2025.1622536/full",
        icon: Heart,
    },
    {
        text: 'Pais que ouvem histórias junto aos filhos fortalecem vínculo afetivo e criam rituais positivos.',
        source: 'Harvard – Center on the Developing Child',
        link: 'https://developingchild.harvard.edu',
        icon: Baby,
    },
];

export default function BenefitsInspira() {
  const [showAll, setShowAll] = useState(false);
  
  // Mostra apenas os 8 primeiros inicialmente
  const visibleBenefits = showAll ? BENEFITS : BENEFITS.slice(0, 8);

  return (
    <section id="benefits" className="py-20 bg-brand-dark/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-10 right-10 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl" />
         <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
          >
            Por que escolher o <span className="text-brand-teal">Ninaro?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            Descubra como a música e as histórias podem transformar o desenvolvimento do seu bebê, com base em estudos científicos.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {visibleBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <div className="mb-4 bg-brand-teal/20 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-6 h-6 text-brand-teal" />
                </div>
                <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                  "{benefit.text}"
                </p>
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">Fonte: {benefit.source}</span>
                  <a 
                    href={benefit.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-teal hover:text-brand-purple transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!showAll && (
          <div className="mt-12 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAll(true)}
              className="bg-brand-purple text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-purple/90 transition-colors shadow-lg shadow-brand-purple/20"
            >
              Ver mais motivos
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}
