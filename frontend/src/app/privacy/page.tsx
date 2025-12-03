import React from "react";
import NavbarInspira from "@/components/inspira/NavbarInspira";
import FooterInspira from "@/components/inspira/FooterInspira";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-teal selection:text-brand-dark font-sans">
      <NavbarInspira />
      <main className="pt-32 pb-20 container mx-auto px-6">
        <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm text-gray-200">
          <h1 className="text-3xl font-bold mb-6 text-white">Política de Privacidade</h1>
          
          <div className="space-y-4 leading-relaxed">
            <p>
              A sua privacidade é importante para nós. É política do Ninaro respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Ninaro, e outros sites que possuímos e operamos.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-2">1. Informações que coletamos</h2>
            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">2. Uso de informações</h2>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">3. Compartilhamento de dados</h2>
            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">4. Compromisso do Usuário</h2>
            <p>
              O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o Ninaro oferece no site e com caráter enunciativo, mas não limitativo:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
              <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
              <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Ninaro, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
            </ul>

            <p className="mt-6">
              Esta política é efetiva a partir de <strong>Dezembro de 2024</strong>.
            </p>
          </div>
        </Card>
      </main>
      <FooterInspira />
    </div>
  );
}
