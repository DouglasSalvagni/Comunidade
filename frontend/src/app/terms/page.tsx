import React from "react";
import NavbarInspira from "@/components/inspira/NavbarInspira";
import FooterInspira from "@/components/inspira/FooterInspira";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-teal selection:text-brand-dark font-sans">
      <NavbarInspira />
      <main className="pt-32 pb-20 container mx-auto px-6">
        <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm text-gray-200">
          <h1 className="text-3xl font-bold mb-6 text-white">Termos de Uso</h1>
          
          <div className="space-y-4 leading-relaxed">
            <h2 className="text-xl font-semibold text-white mt-6 mb-2">1. Termos</h2>
            <p>
              Ao acessar ao site Ninaro, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-2">2. Uso de Licença</h2>
            <p>
              É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Ninaro , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>modificar ou copiar os materiais;</li>
              <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
              <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Ninaro;</li>
              <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
              <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">3. Isenção de responsabilidade</h2>
            <p>
              Os materiais no site da Ninaro são fornecidos 'como estão'. Ninaro não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">4. Limitações</h2>
            <p>
              Em nenhum caso o Ninaro ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em Ninaro, mesmo que Ninaro ou um representante autorizado da Ninaro tenha sido notificado oralmente ou por escrito da possibilidade de tais danos.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">5. Precisão dos materiais</h2>
            <p>
              Os materiais exibidos no site da Ninaro podem incluir erros técnicos, tipográficos ou fotográficos. Ninaro não garante que qualquer material em seu site seja preciso, completo ou atual. Ninaro pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, Ninaro não se compromete a atualizar os materiais.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">6. Links</h2>
            <p>
              O Ninaro não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por Ninaro do site. O uso de qualquer site vinculado é por conta e risco do usuário.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">Modificações</h2>
            <p>
              O Ninaro pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-2">Lei aplicável</h2>
            <p>
              Estes termos e condições são regidos e interpretados de acordo com as leis do Ninaro e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.
            </p>
          </div>
        </Card>
      </main>
      <FooterInspira />
    </div>
  );
}
