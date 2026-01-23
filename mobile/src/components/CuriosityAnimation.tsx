import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
    FadeIn, 
    FadeInRight, 
    FadeInLeft, 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    Easing 
} from 'react-native-reanimated';
import ExternalLinkModal from './ExternalLinkModal';

const { width } = Dimensions.get('window');

type Curiosity = {
    text: string;
    source: string;
    link: string;
};

const CURIOSITIES: Curiosity[] = [
    {
        text: 'Ouvir música desde bebê estimula áreas do cérebro responsáveis pela linguagem e fala.',
        source: 'UNICEF',
        link: 'https://www.unicef.org/parenting/child-development/baby-music-soundtrack-to-development',
    },
    {
        text: 'Músicas de ninar ajudam a regular o sono do bebê e a reduzir o nível de estresse.',
        source: 'Sleep Foundation',
        link: 'https://www.parents.com/parents-say-music-helps-their-babies-sleep-better-heres-what-to-try-11803447',
    },
    {
        text: 'Crianças expostas à música desenvolvem melhor a coordenação motora e o raciocínio lógico.',
        source: 'Harvard Health',
        link: 'https://www.health.harvard.edu/blog/why-is-music-good-for-the-brain-2020100721062',
    },
    {
        text: 'Audiobooks estimulam a imaginação e a criatividade, permitindo que a criança crie suas próprias imagens mentais.',
        source: 'Scholastic',
        link: 'https://www.scarymommy.com/lifestyle/are-audiobooks-good-for-kids-brain-development',
    },
    {
        text: 'Educação musical está associada a melhor desempenho cognitivo entre 5 e 14 anos.',
        source: 'Rast Musicology Journal (2025)',
        link: 'https://dergipark.org.tr/en/pub/rastmd/issue/90359/1611521',
    },
    {
        text: 'Musicalização melhora memória, atenção e concentração.',
        source: 'UNESC (2024)',
        link: 'https://periodicos.unesc.net/ojs/index.php/Inovasaude/article/view/8566',
    },
    {
        text: 'Música reduz estresse e melhora o humor infantil.',
        source: 'Humanium',
        link: 'https://www.humanium.org/en/the-power-of-music-on-childrens-well-being/',
    },
    {
        text: 'Tocar instrumentos desenvolve coordenação motora fina e percepção auditiva.',
        source: 'UNICEF',
        link: 'https://www.unicef.org/parenting/child-development/baby-music-soundtrack-to-development',
    },
    {
        text: 'Audiobooks ajudam crianças a aprender vocabulário, pronúncia e reconhecimento de palavras novas.',
        source: 'Collaborative for Children',
        link: 'https://collabforchildren.org/resources-for-families/resource-library/the-benefits-of-audiobooks-for-helping-children-learn/'
    },
    {
        text: 'Ouvir histórias em áudio expõe crianças a vocabulário mais rico e variado do que o cotidiano, ajudando no desenvolvimento da linguagem.',
        source: 'The 74',
        link: 'https://www.the74million.org/article/want-to-spur-your-childs-intellectual-development-use-audiobooks-instead-of-videos/'
    },
    {
        text: 'A escuta de audiobooks permite que crianças reconheçam palavras desconhecidas e aprendam sua pronúncia e uso correto em frases narrativas.',
        source: 'Words for Life',
        link: 'https://wordsforlife.org.uk/activities/what-are-the-benefits-of-listening-to-audiobooks-as-a-family-at-home/'
    },
    {
        text: 'Audiobooks podem expandir o vocabulário e melhorar a fluência de leitura e escuta, especialmente para crianças que ainda não conseguem ler de forma independente.',
        source: 'Bookmark Reading',
        link: 'https://www.bookmarkreading.org/news/5-ways-audiobooks-can-help-children-develop-a-buzz-for-reading'
    },
    {
        text: 'Ouvir audiolivros melhora a compreensão auditiva e favorece a interpretação de narrativas e linguagem falada.',
        source: 'TADQIQOTLAR (2025)',
        link: 'https://journalss.org/index.php/tad/article/view/4336'
    },
    {
        text: 'Audiolivros ajudam no desenvolvimento da escuta ativa e compreensão de sentido, beneficiando quem tem dificuldades com leitura tradicional.',
        source: 'Elefante Letrado',
        link: 'https://blog.elefanteletrado.com.br/beneficios-audiolivros-inclusao-sala-de-aula/'
    },
    {
        text: 'Estudos mostram que o uso de audiolivros pode aumentar as habilidades de compreensão auditiva e compreensão de texto em contextos educativos.',
        source: 'Educational Psychology Review (2025)',
        link: 'https://ecc-cornerstone.com/2025/05/01/learning-through-listening-exploring-the-legitimacy-of-audiobooks-in-education/'
    },
    {
        text: 'Ouvir audiolivros desenvolve a escuta ativa e a capacidade de manter a atenção por períodos mais longos, ao exigir que a criança acompanhe a narrativa sem estímulos visuais.',
        source: 'Phys.org',
        link: 'https://phys.org/news/2024-07-spur-child-intellectual-audiobooks-videos.html'
    },
    {
        text: 'Histórias em áudio promovem foco e concentração — crianças precisam manter o enredo em mente, seguir personagens e acompanhar sequências narrativas, o que treina a atenção sustentada.',
        source: 'Helios Kids',
        link: 'https://helioskids.com/en/why-listening-to-audio-stories-improves-concentration-and-vocabulary/'
    },
    {
        text: "Sem imagens visuais, audiobooks incentivam a criança a imaginar cenários, personagens e ambientes por conta própria, estimulando a imaginação e o “teatro mental”.",
        source: "The 74",
        link: "https://www.the74million.org/article/want-to-spur-your-childs-intellectual-development-use-audiobooks-instead-of-videos/"
    },
    {
        text: "Ouvir histórias narradas estimula imaginação e criatividade, pois obriga a criança a formar imagens mentais e representar internamente cenas e personagens — algo que vídeos e imagens prontas não exigem.",
        source: "Bookmark Reading",
        link: "https://www.bookmarkreading.org/news/5-ways-audiobooks-can-help-children-develop-a-buzz-for-reading"
    },
    {
        text: "Ouvir histórias narradas — como em audiolivros — permite que crianças entrem em contato com personagens, dilemas e emoções variadas, o que ajuda no desenvolvimento da empatia e compreensão de emoções complexas.",
        source: "The Imagine Project",
        link: "https://theimagineproject.org/how-audiobooks-can-help-improve-childrens-literacy-and-sel/"
    },
    {
        text: "Histórias narradas e contação de histórias favorecem a percepção de estados emocionais e relações sociais das personagens, o que exerce a empatia e o entendimento emocional nas crianças.",
        source: "Frontiers (revisão sobre Shared Book Reading e competências socioemocionais)",
        link: "https://www.frontiersin.org/articles/10.3389/fpsyg.2025.1622536/full"
    },
    {
        text: 'Pais que ouvem histórias junto aos filhos fortalecem vínculo afetivo e criam rituais positivos.',
        source: 'Harvard – Center on the Developing Child',
        link: 'https://developingchild.harvard.edu',
    },
];

export default function CuriosityAnimation() {
    const [curiosity, setCuriosity] = useState<Curiosity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const translateY = useSharedValue(0);

    useEffect(() => {
        const randomCuriosity = CURIOSITIES[Math.floor(Math.random() * CURIOSITIES.length)];
        setCuriosity(randomCuriosity);
        translateY.value = withRepeat(
            withTiming(-10, { 
                duration: 2000, 
                easing: Easing.inOut(Easing.ease) 
            }),
            -1, 
            true
        );
    }, []);

    const floatingStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    if (!curiosity) return null;

    const handleLinkPress = () => {
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <ExternalLinkModal
                visible={modalVisible}
                url={curiosity.link}
                onClose={() => setModalVisible(false)}
            />
            <Animated.View entering={FadeInLeft.duration(800).delay(300)} style={styles.bubbleContainer}>
                <View style={styles.bubble}>
                    <Text style={styles.text}>"{curiosity.text}"</Text>
                    <View style={styles.sourceContainer}>
                        <Text style={styles.sourceLabel}>fonte: </Text>
                        <TouchableOpacity onPress={handleLinkPress}>
                            <Text style={styles.sourceLink}>{curiosity.source}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.arrowBorder} />
                <View style={styles.arrow} />
            </Animated.View>

            <Animated.View entering={FadeInRight.duration(800)} style={[styles.characterContainer, floatingStyle]}>
                <Image
                    source={require('../../assets/char-ventinho-mini.png')}
                    style={styles.character}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginTop: 10,
        marginBottom: 10,
        width: '100%',
    },
    bubbleContainer: {
        flex: 1,
        marginRight: 15,
        marginBottom: 30,
        position: 'relative',
    },
    bubble: {
        backgroundColor: '#0e1430',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#384669ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    text: {
        fontSize: 14,
        color: '#e6e9ff',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    sourceContainer: {
        flexDirection: 'row',
        marginTop: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    sourceLabel: {
        fontSize: 12,
        color: '#8b92b8',
    },
    sourceLink: {
        fontSize: 12,
        color: '#A78BFA',
        textDecorationLine: 'underline',
        fontWeight: 'bold',
    },
    arrow: {
        position: 'absolute',
        right: -12,
        bottom: 20,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: 10,
        borderRightWidth: 0,
        borderBottomWidth: 10,
        borderLeftWidth: 15,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: '#0e1430',
    },
    arrowBorder: {
        position: 'absolute',
        right: -13.5,
        bottom: 20,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: 10,
        borderRightWidth: 0,
        borderBottomWidth: 10,
        borderLeftWidth: 15,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: '#384669ff',
    },
    characterContainer: {
        width: 100,
        height: 120,
        justifyContent: 'flex-end',
    },
    character: {
        width: '100%',
        height: '100%',
    },
});
