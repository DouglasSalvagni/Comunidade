import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../..//modules/users/entities/user.entity'
import { Plan } from '../..//modules/subscriptions/entities/plan.entity'
import { Subscription } from '../..//modules/subscriptions/entities/subscription.entity'
import { SystemSetting } from '../..//modules/settings/entities/system-setting.entity'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/comunidade'
const isProd = process.env.NODE_ENV === 'production'
const rawSsl = process.env.DB_SSL || process.env.DATABASE_SSL
const useSsl = rawSsl !== undefined
  ? ['true', '1', 'yes', 'on'].includes(String(rawSsl).toLowerCase())
  : isProd

const dataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [
    User,
    Plan,
    Subscription,
    SystemSetting,
  ],
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

async function run() {
  await dataSource.initialize()
  const userRepo = dataSource.getRepository(User)

  console.log('Seed: Inserindo membros de teste...')

  const passwordHash = await bcrypt.hash('password123', 10)
  
  const members = [
    { name: 'Ana Silva', email: 'ana.silva@example-seed.com', bio: 'Entusiasta de tecnologia e música.' },
    { name: 'Bruno Santos', email: 'bruno.santos@example-seed.com', bio: 'Desenvolvedor fullstack nas horas vagas.' },
    { name: 'Carla Oliveira', email: 'carla.oliveira@example-seed.com', bio: 'Amo ler e compartilhar conhecimento.' },
    { name: 'Diego Ferreira', email: 'diego.ferreira@example-seed.com', bio: 'Sempre em busca de novos desafios.' },
    { name: 'Elena Souza', email: 'elena.souza@example-seed.com', bio: 'Designer apaixonada por UX.' },
    { name: 'Fabio Lima', email: 'fabio.lima@example-seed.com', bio: 'Músico e produtor de conteúdo.' },
    { name: 'Gisele Costa', email: 'gisele.costa@example-seed.com', bio: 'Aprendendo algo novo todos os dias.' },
    { name: 'Hugo Rocha', email: 'hugo.rocha@example-seed.com', bio: 'Fotógrafo amador e viajante.' },
    { name: 'Isabela Martins', email: 'isabela.martins@example-seed.com', bio: 'Escritora e sonhadora.' },
    { name: 'João Pereira', email: 'joao.pereira@example-seed.com', bio: 'Engenheiro de software e gamer.' },
    { name: 'Kleber Machado', email: 'kleber.machado@example-seed.com', bio: 'Narrador e apaixonado por esportes.' },
    { name: 'Lúcia Ferreira', email: 'lucia.ferreira@example-seed.com', bio: 'Chef de cozinha e exploradora de sabores.' },
    { name: 'Marcos Mion', email: 'marcos.mion@example-seed.com', bio: 'Apresentador e entusiasta de cultura pop.' },
    { name: 'Natália Guimarães', email: 'natalia.guimaraes@example-seed.com', bio: 'Modelo e empresária do ramo da beleza.' },
    { name: 'Otávio Mesquita', email: 'otavio.mesquita@example-seed.com', bio: 'Curioso profissional e viajante.' },
    { name: 'Patrícia Poeta', email: 'patricia.poeta@example-seed.com', bio: 'Jornalista e apaixonada por boas histórias.' },
    { name: 'Quiteria Chagas', email: 'quiteria.chagas@example-seed.com', bio: 'Dançarina e pesquisadora cultural.' },
    { name: 'Ricardo Amorim', email: 'ricardo.amorim@example-seed.com', bio: 'Economista focado no futuro do Brasil.' },
    { name: 'Sabrina Sato', email: 'sabrina.sato@example-seed.com', bio: 'Apresentadora e ícone de estilo.' },
    { name: 'Tiago Leifert', email: 'tiago.leifert@example-seed.com', bio: 'Gamer e entusiasta de entretenimento.' },
    { name: 'Ursula Bezerra', email: 'ursula.bezerra@example-seed.com', bio: 'Dubladora e apaixonada por animação.' },
    { name: 'Vitor Kley', email: 'vitor.kley@example-seed.com', bio: 'Músico e compositor de boas vibrações.' },
    { name: 'Wagner Moura', email: 'wagner.moura@example-seed.com', bio: 'Ator e diretor comprometido com a arte.' },
    { name: 'Xuxa Meneghel', email: 'xuxa.meneghel@example-seed.com', bio: 'Eterna rainha e defensora dos animais.' },
    { name: 'Yasmim Brunet', email: 'yasmim.brunet@example-seed.com', bio: 'Modelo e entusiasta de vida saudável.' },
    { name: 'Zeca Pagodinho', email: 'zeca.pagodinho@example-seed.com', bio: 'Músico e amante da vida boêmia.' },
    { name: 'André Marques', email: 'andre.marques@example-seed.com', bio: 'DJ e apresentador apaixonado por culinária.' },
    { name: 'Bárbara Evans', email: 'barbara.evans@example-seed.com', bio: 'Modelo e influenciadora digital.' },
    { name: 'Caio Castro', email: 'caio.castro@example-seed.com', bio: 'Ator e piloto de automobilismo.' },
    { name: 'Deborah Secco', email: 'deborah.secco@example-seed.com', bio: 'Atriz apaixonada por novos personagens.' },
    { name: 'Emilio Dantas', email: 'emilio.dantas@example-seed.com', bio: 'Ator e cantor em constante evolução.' },
    { name: 'Fernanda Gentil', email: 'fernanda.gentil@example-seed.com', bio: 'Jornalista e contadora de histórias.' },
    { name: 'Gabriel Lacerda', email: 'gabriel.lacerda@example-seed.com', bio: 'Empreendedor serial e mentor.' },
    { name: 'Heloísa Périssé', email: 'heloisa.perisse@example-seed.com', bio: 'Atriz e roteirista apaixonada pelo riso.' },
    { name: 'Ícaro Silva', email: 'icaro.silva@example-seed.com', bio: 'Ator e cantor multifacetado.' },
    { name: 'Juliana Paes', email: 'juliana.paes@example-seed.com', bio: 'Atriz e empresária do ramo da moda.' },
    { name: 'Kauan Rodrigues', email: 'kauan.rodrigues@example-seed.com', bio: 'Músico sertanejo e compositor.' },
    { name: 'Larissa Manoela', email: 'larissa.manoela@example-seed.com', bio: 'Atriz e cantora desde a infância.' },
    { name: 'Murilo Benício', email: 'murilo.benicio@example-seed.com', bio: 'Ator e diretor de cinema.' },
    { name: 'Nanda Costa', email: 'nanda.costa@example-seed.com', bio: 'Atriz e defensora da diversidade.' },
  ]

  let count = 0
  for (const m of members) {
    const existing = await userRepo.findOne({ where: { email: m.email } })
    if (!existing) {
      const user = userRepo.create({
        ...m,
        passwordHash,
        role: 'user',
        emailVerified: true,
        isActive: true,
      })
      await userRepo.save(user)
      console.log(`Seed: Membro criado: ${m.name} (${m.email})`)
      count++
    }
  }

  console.log(`Seed finalizado! ${count} novos membros inseridos.`)
  await dataSource.destroy()
}

run().catch((error) => {
  console.error('Erro ao executar seed de membros:', error)
  process.exit(1)
})
