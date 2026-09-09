(() => {
  'use strict';
  const languages = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt'];
  // Each row: English, Simplified Chinese, Korean, Spanish, French, German, Portuguese.
  // Japanese remains the authored source in the HTML. No external translation service.
  const copy = {
    skipIntro: ['Skip intro','跳过开场','인트로 건너뛰기','Saltar introducción','Passer l’introduction','Intro überspringen','Pular introdução'],
    realFootage: ['Physical experiment','实机影像','실제 기기 영상','Experimento real','Expérience réelle','Realer Versuch','Experimento real'],
    controlView: ['Control visualization','控制可视化','제어 시각화','Visualización del control','Visualisation du contrôle','Visualisierung der Steuerung','Visualização do controle'],
    researcherLabel: ['Robotics researcher','机器人研究者','로봇 연구자','Investigador en robótica','Chercheur en robotique','Robotikforscher','Pesquisador em robótica'],
    thesisFirst: ['Body augmentation','身体增强','신체 확장','Ampliación corporal','Augmentation corporelle','Körpererweiterung','Ampliação corporal'],
    thesisSecond: ['Human–machine cooperation','人机协作','인간과 기계의 협력','Cooperación entre personas y máquinas','Coopération humain–machine','Zusammenarbeit von Mensch und Maschine','Cooperação entre pessoas e máquinas'],
    exploreResearch: ['Explore the research','探索研究','연구 살펴보기','Explorar la investigación','Découvrir les recherches','Forschung entdecken','Explorar a pesquisa'],

    skipContent: ['Skip to content','跳转到正文','본문으로 건너뛰기','Saltar al contenido','Aller au contenu','Zum Inhalt','Ir para o conteúdo'],
    chooseLanguage: ['Choose language','选择语言','언어 선택','Elegir idioma','Choisir la langue','Sprache wählen','Escolher idioma'],
    display: ['Display','显示','화면','Vista','Vue','Ansicht','Tela'],
    displaySettings: ['Display settings','显示设置','화면 설정','Opciones de visualización','Réglages d’affichage','Anzeigeeinstellungen','Opções de exibição'],
    theme: ['Color theme','颜色主题','색상 테마','Tema de color','Thème de couleur','Farbschema','Tema de cores'],
    light: ['Light','浅色','라이트','Claro','Clair','Hell','Claro'],
    dark: ['Dark','深色','다크','Oscuro','Sombre','Dunkel','Escuro'],
    system: ['Use device setting','跟随系统','기기 설정 사용','Usar ajuste del dispositivo','Suivre l’appareil','Geräteeinstellung','Usar configuração do dispositivo'],
    menu: ['Menu','菜单','메뉴','Menú','Menu','Menü','Menu'],
    close: ['Close','关闭','닫기','Cerrar','Fermer','Schließen','Fechar'],
    home: ['Suzuki Yuma — home','Suzuki Yuma — 首页','Suzuki Yuma — 처음으로','Suzuki Yuma — inicio','Suzuki Yuma — accueil','Suzuki Yuma — Startseite','Suzuki Yuma — início'],
    navigation: ['Main navigation','主导航','주 메뉴','Navegación principal','Navigation principale','Hauptnavigation','Navegação principal'],
    mobileNavigation: ['Mobile navigation','移动端导航','모바일 메뉴','Navegación móvil','Navigation mobile','Mobile Navigation','Navegação móvel'],
    profile: ['Profile','个人简介','소개','Perfil','Profil','Profil','Perfil'],
    research: ['Research','研究','연구','Investigación','Recherche','Forschung','Pesquisa'],
    papers: ['Publications','论文','논문','Publicaciones','Publications','Publikationen','Publicações'],
    activities: ['Activities','动态','활동','Actividad','Activités','Aktivitäten','Atividades'],
    contact: ['Contact','联系','연락','Contacto','Contact','Kontakt','Contato'],
    position: ['PhD student / MITOU Advanced ’25 participant','博士生 / 2025 年度 MITOU Advanced 项目成员','박사과정 / MITOU Advanced ’25 참여자','Doctorando / participante de MITOU Advanced ’25','Doctorant / participant à MITOU Advanced ’25','Doktorand / Teilnehmer an MITOU Advanced ’25','Doutorando / participante do MITOU Advanced ’25'],
    affiliation: ['Graduate School of Science and Technology, Keio University','庆应义塾大学大学院 理工学研究科','게이오기주쿠대학교 대학원 이공학연구과','Escuela de Posgrado de Ciencia y Tecnología, Universidad de Keio','École doctorale des sciences et technologies, Université Keio','Graduiertenschule für Wissenschaft und Technologie, Keio-Universität','Escola de Pós-Graduação em Ciência e Tecnologia, Universidade Keio'],
    lab: ['Takahashi Laboratory','高桥正树研究室','다카하시 마사키 연구실','Laboratorio Takahashi','Laboratoire Takahashi','Takahashi-Labor','Laboratório Takahashi'],
    bio: ['I study how people and machines adapt to one another. Viewing powered wheelchairs as a form of body augmentation, my research explores shared autonomy and learning to operate intelligent machines.','我研究人与机器如何相互适应。我将电动轮椅视为身体增强的一种形式，探索共享自主控制以及智能机器的操作学习。','사람과 기계가 서로 적응하는 방식을 연구합니다. 전동휠체어를 신체 확장의 한 형태로 보고, 공유 자율성과 지능형 기계의 조작 학습을 탐구합니다.','Investigo cómo las personas y las máquinas se adaptan mutuamente. Considero las sillas de ruedas eléctricas una forma de ampliación corporal y estudio la autonomía compartida y el aprendizaje del manejo de máquinas inteligentes.','J’étudie la manière dont les personnes et les machines s’adaptent mutuellement. Envisageant le fauteuil roulant électrique comme une forme d’augmentation corporelle, mes recherches portent sur l’autonomie partagée et l’apprentissage du pilotage de machines intelligentes.','Ich untersuche, wie sich Menschen und Maschinen aneinander anpassen. Elektrische Rollstühle verstehe ich als eine Form der Körpererweiterung. Dabei erforsche ich geteilte Autonomie und das Erlernen der Bedienung intelligenter Maschinen.','Investigo como pessoas e máquinas se adaptam umas às outras. Considero as cadeiras de rodas elétricas uma forma de ampliação corporal e estudo a autonomia compartilhada e a aprendizagem da operação de máquinas inteligentes.'],
    photoAlt: ['Yuma Suzuki using a powered wheelchair','乘坐电动轮椅的铃木悠真','전동휠체어를 타고 있는 스즈키 유마','Yuma Suzuki utilizando una silla de ruedas eléctrica','Yuma Suzuki utilisant un fauteuil roulant électrique','Yuma Suzuki in einem elektrischen Rollstuhl','Yuma Suzuki utilizando uma cadeira de rodas elétrica'],
    photoName: ['Yuma Suzuki','铃木悠真','스즈키 유마','Yuma Suzuki','Yuma Suzuki','Yuma Suzuki','Yuma Suzuki'],
    photoCaption: ['Mobility as body augmentation','将移动视为身体增强','신체 확장으로서의 이동','Movilidad y ampliación corporal','Mobilité et augmentation corporelle','Mobilität als Körpererweiterung','Mobilidade e ampliação corporal'],
    readPapers: ['Read publications','阅读论文','논문 보기','Ver publicaciones','Voir les publications','Publikationen lesen','Ver publicações'],
    researchTitle: ['Research themes','研究主题','연구 주제','Líneas de investigación','Axes de recherche','Forschungsthemen','Temas de pesquisa'],
    sharedTitle: ['Shared control of\npowered wheelchairs','电动轮椅的\n共享控制','전동휠체어의\n공유 제어','Control compartido de\nsillas de ruedas eléctricas','Contrôle partagé des\nfauteuils roulants électriques','Geteilte Steuerung\nelektrischer Rollstühle','Controle compartilhado de\ncadeiras de rodas elétricas'],
    sharedBody: ['Shared control for powered wheelchairs combines a rider’s input with autonomous assistance. I explore human–machine cooperation through the relationship between control and movement.','电动轮椅的共享控制结合乘坐者的操作与自主辅助。我从操作与移动的关系出发，探索人与机器的协作。','전동휠체어의 공유 제어는 탑승자의 조작과 자율 지원을 결합합니다. 조작과 이동의 관계를 통해 사람과 기계의 협력을 탐구합니다.','El control compartido de sillas de ruedas eléctricas combina las órdenes del usuario con asistencia autónoma. Exploro la cooperación entre personas y máquinas a través de la relación entre control y movimiento.','Le contrôle partagé d’un fauteuil roulant électrique associe les commandes de l’utilisateur à une assistance autonome. J’explore la coopération humain–machine à travers la relation entre commande et déplacement.','Die geteilte Steuerung elektrischer Rollstühle kombiniert Eingaben der Nutzenden mit autonomer Unterstützung. Ich erforsche die Zusammenarbeit von Mensch und Maschine anhand der Beziehung zwischen Steuerung und Bewegung.','O controle compartilhado de cadeiras de rodas elétricas combina os comandos do usuário com assistência autônoma. Exploro a cooperação entre pessoas e máquinas pela relação entre controle e movimento.'],
    relatedPresentation: ['Related presentation','相关研究报告','관련 연구 발표','Presentación relacionada','Communication associée','Zugehöriger Beitrag','Apresentação relacionada'],
    sharedVideo: ['Shared-control experiment','共享控制实验视频','공유 제어 실험 영상','Experimento de control compartido','Expérience de contrôle partagé','Versuch zur geteilten Steuerung','Experimento de controle compartilhado'],
    bodyTitle: ['Wheelchair control\nthrough trunk movement','通过躯干动作\n控制轮椅','몸통 움직임을 통한\n휠체어 조작','Control de sillas de ruedas\nmediante movimientos del tronco','Commande de fauteuil roulant\npar les mouvements du tronc','Rollstuhlsteuerung\ndurch Rumpfbewegungen','Controle de cadeiras de rodas\npor movimentos do tronco'],
    bodyBody: ['A belt-type interface enables powered-wheelchair control through trunk movement. Focusing on individual differences and control performance, I study mobility as a form of body augmentation.','通过腰带式接口，以躯干动作操作电动轮椅。我关注身体的个体差异与操作性能，研究作为身体增强形式的移动。','벨트형 인터페이스를 이용해 몸통의 움직임으로 전동휠체어를 조작합니다. 신체의 개인차와 조작 성능에 주목하며, 신체 확장으로서의 이동을 연구합니다.','Una interfaz de tipo cinturón permite controlar una silla de ruedas eléctrica mediante el movimiento del tronco. Estudio la movilidad como ampliación corporal, centrándome en las diferencias individuales y el rendimiento del control.','Une interface de type ceinture permet de commander un fauteuil roulant électrique par les mouvements du tronc. J’étudie la mobilité comme augmentation corporelle, en m’intéressant aux différences individuelles et aux performances de commande.','Eine gürtelartige Schnittstelle ermöglicht die Steuerung eines elektrischen Rollstuhls durch Rumpfbewegungen. Mit Blick auf individuelle Unterschiede und die Steuerungsleistung erforsche ich Mobilität als Körpererweiterung.','Uma interface em forma de cinto permite controlar uma cadeira de rodas elétrica pelos movimentos do tronco. Estudo a mobilidade como ampliação corporal, com foco nas diferenças individuais e no desempenho do controle.'],
    relatedPaper: ['Related paper','相关论文','관련 논문','Artículo relacionado','Article associé','Zugehörige Publikation','Artigo relacionado'],
    humoniiLink: ['Project / Humonii','项目 / Humonii','프로젝트 / Humonii','Proyecto / Humonii','Projet / Humonii','Projekt / Humonii','Projeto / Humonii'],
    humoniiShortcut: ['Humonii / Project','Humonii / 项目','Humonii / 프로젝트','Humonii / Proyecto','Humonii / Projet','Humonii / Projekt','Humonii / Projeto'],
    humoniiKicker: ['Project','项目','프로젝트','Proyecto','Projet','Projekt','Projeto'],
    humoniiDescription: ['A project developing Feeling, a mobility device controlled by trunk movements, and bringing it into practical use.','开发由躯干动作控制的移动设备 Feeling，并推进其实际应用的项目。','몸통 움직임으로 조작하는 모빌리티 Feeling을 개발하고 실용화를 추진하는 프로젝트.','Proyecto de desarrollo y aplicación práctica de Feeling, un dispositivo de movilidad controlado mediante movimientos del tronco.','Projet de développement et de mise en application de Feeling, un dispositif de mobilité commandé par les mouvements du tronc.','Projekt zur Entwicklung und praktischen Anwendung von Feeling, einem durch Rumpfbewegungen gesteuerten Mobilitätsgerät.','Projeto de desenvolvimento e aplicação prática do Feeling, um dispositivo de mobilidade controlado por movimentos do tronco.'],
    humoniiVisit: ['Visit the official website','访问官方网站','공식 사이트 보기','Visitar el sitio oficial','Visiter le site officiel','Offizielle Website besuchen','Visitar o site oficial'],
    feelingVideo: ['Feeling — mobility through trunk control','Feeling — 通过躯干动作控制移动','Feeling — 몸통 조작을 통한 이동','Feeling — movilidad controlada con el tronco','Feeling — mobilité commandée par le tronc','Feeling — Mobilität durch Rumpfsteuerung','Feeling — mobilidade controlada pelo tronco'],
    videoUnavailable: ['Your browser cannot play this video. ','浏览器无法播放此视频。','이 브라우저에서는 영상을 재생할 수 없습니다. ','El navegador no puede reproducir este vídeo. ','Ce navigateur ne peut pas lire cette vidéo. ','Dieser Browser kann das Video nicht abspielen. ','O navegador não pode reproduzir este vídeo. '],
    openVideo: ['Open video','打开视频','영상 열기','Abrir vídeo','Ouvrir la vidéo','Video öffnen','Abrir vídeo'],
    publicationsTitle: ['Papers & presentations','论文与研究报告','논문 및 연구 발표','Artículos y presentaciones','Articles et communications','Publikationen und Beiträge','Artigos e apresentações'],
    filterLabel: ['Filter publications by research topic','按研究主题筛选论文','연구 주제별 논문 필터','Filtrar por tema de investigación','Filtrer par thème de recherche','Nach Forschungsthema filtern','Filtrar por tema de pesquisa'],
    all: ['All','全部','전체','Todas','Toutes','Alle','Todas'],
    bodyFilter: ['Body interfaces','身体接口','신체 인터페이스','Interfaces corporales','Interfaces corporelles','Körperschnittstellen','Interfaces corporais'],
    sharedFilter: ['Shared control','共享控制','공유 제어','Control compartido','Contrôle partagé','Geteilte Steuerung','Controle compartilhado'],
    paperCount: ['Publications shown: {count}','显示 {count} 篇论文与报告','논문 및 발표 {count}건 표시','Publicaciones visibles: {count}','Publications affichées : {count}','Angezeigte Publikationen: {count}','Publicações exibidas: {count}'],
    international: ['International conference','国际会议','국제 학술대회','Congreso internacional','Conférence internationale','Internationale Konferenz','Conferência internacional'],
    domestic: ['Conference in Japan','日本国内会议','일본 국내 학술대회','Congreso en Japón','Conférence au Japon','Konferenz in Japan','Conferência no Japão'],
    beltContext: ['Evaluating a belt-type interface while accounting for individual differences in body-axis alignment.','考虑身体轴线个体差异的腰带式接口操作性能评估。','신체 축의 개인차를 고려한 벨트형 인터페이스의 조작 성능 평가.','Evaluación de una interfaz de tipo cinturón considerando las diferencias individuales en la alineación del eje corporal.','Évaluation d’une interface de type ceinture tenant compte des différences individuelles d’alignement de l’axe corporel.','Bewertung einer gürtelartigen Schnittstelle unter Berücksichtigung individueller Unterschiede der Körperachse.','Avaliação de uma interface em forma de cinto considerando diferenças individuais no alinhamento do eixo corporal.'],
    interfacePaper: ['Evaluation of Wheelchair Control Performance Using a Belt-Type Interface','使用腰带式接口的轮椅操作性能评估','벨트형 인터페이스를 이용한 휠체어 조작 성능 평가','Evaluación del control de una silla de ruedas mediante una interfaz de tipo cinturón','Évaluation des performances de commande d’un fauteuil roulant à l’aide d’une interface de type ceinture','Bewertung der Rollstuhlsteuerung mit einer gürtelartigen Schnittstelle','Avaliação do controle de uma cadeira de rodas com uma interface em forma de cinto'],
    sharedPaper: ['Force-Based Shared Control Adapted to Wheelchair Rider Behavior','适应轮椅乘坐者行为的力基础共享控制','휠체어 탑승자의 행동에 적응하는 힘 기반 공유 제어','Control compartido basado en fuerzas y adaptado al comportamiento del usuario de una silla de ruedas','Contrôle partagé fondé sur les forces et adapté au comportement de l’utilisateur d’un fauteuil roulant','Kraftbasierte geteilte Steuerung mit Anpassung an das Verhalten der Rollstuhlnutzenden','Controle compartilhado baseado em forças e adaptado ao comportamento do usuário da cadeira de rodas'],
    venue: ['ROBOMECH 2025 — Conference on Robotics and Mechatronics','ROBOMECH 2025 — 机器人与机电一体化会议','ROBOMECH 2025 — 로보틱스·메카트로닉스 학술대회','ROBOMECH 2025 — Congreso de Robótica y Mecatrónica','ROBOMECH 2025 — Conférence de robotique et mécatronique','ROBOMECH 2025 — Konferenz für Robotik und Mechatronik','ROBOMECH 2025 — Conferência de Robótica e Mecatrônica'],
    originalTitle: ['Original title (Japanese)','原题（日语）','원제 (일본어)','Título original (japonés)','Titre original (japonais)','Originaltitel (Japanisch)','Título original (japonês)'],
    activitiesTitle: ['Activities','活动记录','활동 이력','Actividades','Activités','Aktivitäten','Atividades'],
    selected: ['Selected','入选','선정','Selección','Sélection','Förderung','Seleção'],
    exhibition: ['Exhibition','展示','전시','Exposición','Exposition','Ausstellung','Exposição'],
    award: ['Award','获奖','수상','Premio','Prix','Preis','Prêmio'],
    media: ['Media','报道','보도','Medios','Presse','Presse','Imprensa'],
    trial: ['Field trial','实证','실증','Prueba','Essai','Praxistest','Teste'],
    older: ['Earlier activities','查看更早的动态','이전 활동 보기','Actividades anteriores','Activités précédentes','Frühere Aktivitäten','Atividades anteriores'],
    contactTitle: ['Contact','联系方式','연락처','Contacto','Contact','Kontakt','Contato'],
    copyEmail: ['Copy email address','复制邮箱地址','이메일 주소 복사','Copiar correo electrónico','Copier l’adresse e-mail','E-Mail-Adresse kopieren','Copiar endereço de e-mail'],
    copying: ['Copying…','正在复制…','복사 중…','Copiando…','Copie en cours…','Wird kopiert…','Copiando…'],
    copied: ['Copied','已复制','복사했습니다','Copiado','Adresse copiée','Kopiert','Copiado'],
    copyFallback: ['Select the address to copy it.','请选中地址后复制。','주소를 선택하여 복사해 주세요.','Selecciona la dirección para copiarla.','Sélectionnez l’adresse pour la copier.','Zum Kopieren die Adresse markieren.','Selecione o endereço para copiá-lo.'],
    backTop: ['Back to top ↑','返回顶部 ↑','맨 위로 ↑','Volver arriba ↑','Retour en haut ↑','Nach oben ↑','Voltar ao topo ↑'],
    pageTitle: ['Research & Practice','研究与实践','연구와 실천','Investigación y práctica','Recherche et pratique','Forschung und Praxis','Pesquisa e prática'],
    activity20260116: ['Selected for the 2025 second-half MITOU Advanced program','入选 2025 年度下半年 MITOU Advanced 项目','2025년도 하반기 MITOU Advanced 사업에 선정','Seleccionado para MITOU Advanced, segundo semestre de 2025','Sélectionné pour MITOU Advanced, second semestre 2025','Für MITOU Advanced im zweiten Halbjahr 2025 ausgewählt','Selecionado para o MITOU Advanced no segundo semestre de 2025'],
    activity20251212: ['Presented an artwork using Feeling at KEIO TECHNO-MALL 2025','在 KEIO TECHNO-MALL 2025 展出使用 Feeling 的艺术作品','KEIO TECHNO-MALL 2025에서 Feeling을 활용한 예술 작품 전시','Presentación de una obra artística con Feeling en KEIO TECHNO-MALL 2025','Présentation d’une œuvre utilisant Feeling à KEIO TECHNO-MALL 2025','Ein Kunstwerk mit Feeling bei KEIO TECHNO-MALL 2025 präsentiert','Apresentação de uma obra de arte com Feeling no KEIO TECHNO-MALL 2025'],
    activity20251014: ['CEATEC AWARD 2025 — Mobility category award','CEATEC AWARD 2025 移动出行部门奖','CEATEC AWARD 2025 모빌리티 부문상','CEATEC AWARD 2025 — premio en la categoría de movilidad','CEATEC AWARD 2025 — prix de la catégorie mobilité','CEATEC AWARD 2025 — Preis in der Kategorie Mobilität','CEATEC AWARD 2025 — prêmio na categoria Mobilidade'],
    feelingExhibit: ['Exhibited Feeling at {event}','在 {event} 展出 Feeling','{event}에서 Feeling 전시','Presentación de Feeling en {event}','Présentation de Feeling à {event}','Feeling bei {event} vorgestellt','Apresentação do Feeling em {event}'],
    activity20250703: ['Humonii selected for the Everyday Mobility theme of Mobility for ALL 2025','Humonii 入选 Mobility for ALL 2025“日常出行”主题','Humonii가 Mobility for ALL 2025의 일상 이동 주제에 선정','Humonii seleccionado para el tema de movilidad cotidiana de Mobility for ALL 2025','Humonii sélectionné pour le thème de la mobilité quotidienne de Mobility for ALL 2025','Humonii für das Thema Alltagsmobilität von Mobility for ALL 2025 ausgewählt','Humonii selecionado para o tema de mobilidade cotidiana do Mobility for ALL 2025'],
    activity20250520: ['Feeling and an interview featured on PT-OT-ST.NET','PT-OT-ST.NET 刊登 Feeling 介绍与访谈','PT-OT-ST.NET에 Feeling 소개와 인터뷰 게재','Reportaje sobre Feeling y entrevista en PT-OT-ST.NET','Présentation de Feeling et entretien sur PT-OT-ST.NET','Feeling und ein Interview auf PT-OT-ST.NET vorgestellt','Reportagem sobre Feeling e entrevista no PT-OT-ST.NET'],
    activity20250301: ['Humonii won the top prize at Tokyo Monozukuri Movement 2025','Humonii 荣获 Tokyo Monozukuri Movement 2025 最优秀奖','Humonii가 Tokyo Monozukuri Movement 2025에서 최우수상 수상','Humonii obtuvo el máximo premio en Tokyo Monozukuri Movement 2025','Humonii a remporté le premier prix à Tokyo Monozukuri Movement 2025','Humonii gewann den Hauptpreis bei Tokyo Monozukuri Movement 2025','Humonii recebeu o prêmio principal no Tokyo Monozukuri Movement 2025'],
    activity20240905: ['Humonii’s activities featured in the Kohoku edition of Town News','Town News 港北区版报道 Humonii 的活动','Town News 고호쿠구판에 Humonii의 활동 소개','Las actividades de Humonii en la edición de Kohoku de Town News','Les activités de Humonii présentées dans l’édition de Kohoku de Town News','Bericht über Humonii in der Kohoku-Ausgabe von Town News','Atividades da Humonii na edição de Kohoku do Town News'],
    activity20240819: ['Humonii selected for a technology-startup demonstration support program','Humonii 入选技术型初创企业实证支持项目','Humonii가 기술 스타트업 실증 지원 프로그램에 선정','Humonii seleccionado para un programa de apoyo a pruebas de startups tecnológicas','Humonii sélectionné pour un programme de soutien aux démonstrations de startups technologiques','Humonii für ein Förderprogramm für Praxistests von Technologie-Start-ups ausgewählt','Humonii selecionado para um programa de apoio a demonstrações de startups tecnológicas'],
    activity20230902: ['Participated in field trials for Mobility for ALL 2023','参加 Mobility for ALL 2023 实证实验','Mobility for ALL 2023 실증 실험에 참가','Participación en las pruebas de Mobility for ALL 2023','Participation aux essais de Mobility for ALL 2023','Teilnahme an Praxistests für Mobility for ALL 2023','Participação nos testes do Mobility for ALL 2023'],
    activity20230513: ['Humonii selected for Mobility for ALL 2023','Humonii 入选 Mobility for ALL 2023','Humonii가 Mobility for ALL 2023에 선정','Humonii seleccionado para Mobility for ALL 2023','Humonii sélectionné pour Mobility for ALL 2023','Humonii für Mobility for ALL 2023 ausgewählt','Humonii selecionado para o Mobility for ALL 2023']
  };
  const exhibits = {
    '20251123': 'UNIVERSAL FOOTBALL PARK SHIBUYA 2025',
    '20251102': 'Japan Mobility Show 2025 / Startup Future Factory',
    '20251017': 'Smart City Festa 2025',
    '20251008': ['International welfare equipment exhibition','国际福祉设备展','국제 복지기기 전시회','Exposición internacional de equipos de asistencia','Salon international des équipements d’assistance','Internationale Ausstellung für Hilfsmittel','Exposição internacional de equipamentos assistivos'],
    '20250719': 'Sumacon Fes',
    '20250716': ['Health & Medical Venture Award kickoff','健康医疗创业大奖启动活动','건강의료 벤처 대상 킥오프 행사','Lanzamiento del premio Health & Medical Venture','Lancement du prix Health & Medical Venture','Auftakt zum Health & Medical Venture Award','Abertura do prêmio Health & Medical Venture'],
    '20250305': 'Medical Japan Osaka', '20250124': 'YOXO Festival 2025', '20241213': 'KEIO TECHNO-MALL 2024'
  };
  for (const [date, event] of Object.entries(exhibits)) {
    copy['activity' + date] = copy.feelingExhibit.map((pattern, index) => pattern.replace('{event}', Array.isArray(event) ? event[index] : event));
  }
  const ja = {menu:'メニュー',close:'閉じる',paperCount:'{count}件の論文・研究発表を表示',copying:'コピーしています…',copied:'コピーしました',copyFallback:'アドレスを選択してコピーしてください',pageTitle:'研究と実践',originalTitle:'原題（日本語）'};
  const bindings = [];
  const nativeText = element => [...element.childNodes].map(node => node.nodeName === 'BR' ? '\n' : node.textContent).join('');
  function bind(selector, key, mode = 'text') {
    document.querySelectorAll(selector).forEach(element => {
      const node = mode === 'leading' ? [...element.childNodes].find(child => child.nodeType === 3 && child.textContent.trim()) : element;
      if (!node) return;
      const original = mode.startsWith('attr:') ? element.getAttribute(mode.slice(5)) : mode === 'leading' ? node.textContent : nativeText(element);
      if (!(key in ja)) ja[key] = original || '';
      bindings.push({element, node, key, mode, original});
    });
  }
  document.querySelectorAll('[data-i18n]').forEach(element => bind('[data-i18n="'+element.dataset.i18n+'"]', element.dataset.i18n));
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => bind('[data-i18n-aria-label="'+element.dataset.i18nAriaLabel+'"]', element.dataset.i18nAriaLabel, 'attr:aria-label'));
  bind('.wordmark','home','attr:aria-label'); bind('.desktop-nav','navigation','attr:aria-label'); bind('#mobile-nav','mobileNavigation','attr:aria-label');
  for (const [id,key] of Object.entries({about:'profile',research:'research',publications:'papers',activities:'activities',contact:'contact'})) bind('nav:not(.language-panel) a[href="#'+id+'"]',key);
  bind('.menu-toggle','menu'); bind('label[for="theme"]','theme');
  for (const key of ['light','dark','system']) bind('#theme option[value="'+key+'"]',key);
  bind('.position','position');
  bind('.affiliation','affiliation','leading'); bind('.affiliation a','lab','leading');
  bind('.bio','bio'); bind('.portrait','photoAlt','attr:alt');
  bind('.profile-portrait figcaption','photoName','leading'); bind('.profile-portrait figcaption span','photoCaption');
  bind('.profile-paper-link','readPapers','leading');
  bind('#research-title','researchTitle');
  bind('.research-row:nth-of-type(1) h3','sharedTitle'); bind('.research-row:nth-of-type(1) .research-copy>p','sharedBody');
  bind('.research-row:nth-of-type(1) .row-links a','relatedPresentation','leading'); bind('.research-row:nth-of-type(1) figcaption>span:first-child','sharedVideo');
  bind('.research-row:nth-of-type(2) h3','bodyTitle'); bind('.research-row:nth-of-type(2) .research-copy>p','bodyBody');
  bind('.research-row:nth-of-type(2) .row-links a:first-child','relatedPaper','leading'); bind('.research-row:nth-of-type(2) .row-links a:last-child','humoniiLink','leading');
  bind('.profile-project-link','humoniiShortcut','leading');
  bind('.research-row:nth-of-type(2) figcaption>span:first-child','feelingVideo');
  bind('video','videoUnavailable','leading'); bind('video a','openVideo');
  bind('#publications-title','publicationsTitle'); bind('.paper-filters','filterLabel','attr:aria-label');
  for (const [filter,key] of Object.entries({all:'all',body:'bodyFilter',shared:'sharedFilter'})) bind('[data-filter="'+filter+'"]',key,'leading');
  bind('#paper-belt .paper-meta>span:last-child','international'); bind('#paper-interface .paper-meta>span:last-child,#paper-shared .paper-meta>span:last-child','domestic');
  bind('.paper-context','beltContext');
  for (const [id,key] of Object.entries({'paper-interface':'interfacePaper','paper-shared':'sharedPaper'})) {
    const heading = document.querySelector('#'+id+' h3');
    const original = document.createElement('p'); original.className = 'paper-original'; original.lang = 'ja'; original.hidden = true;
    const caption = document.createElement('span'); caption.className = 'original-title-label';
    original.append(caption, document.createTextNode(' '+heading.textContent)); heading.after(original);
    bind('#'+id+' h3',key); bind('#'+id+' .venue','venue');
  }
  bind('#activities-title','activitiesTitle');
  const kinds = {'採択':'selected','展示':'exhibition','受賞':'award','掲載':'media','実証':'trial'};
  document.querySelectorAll('.activity-list article').forEach((article,index) => {
    article.dataset.entry = String(index);
    const key = 'activity'+article.querySelector('time').dateTime.replaceAll('-','');
    bind('[data-entry="'+index+'"]>a,[data-entry="'+index+'"]>p',key,'leading');
    bind('[data-entry="'+index+'"] .activity-kind',kinds[article.querySelector('.activity-kind').textContent]);
  });
  bind('.older-activities summary','older','leading'); bind('.site-footer h2','contactTitle'); bind('#copy-email','copyEmail'); bind('.footer-bottom>a','backTop');

  let current = 'ja';
  const japanesePhrases = {
    humoniiDescription: [['体幹で操作する','モビリティ「Feeling」の','開発・社会実装プロジェクト。']],
    bio: [['人と機械が、','互いに適応する','仕組みを','研究しています。'],['電動車いすを','身体拡張の','一形態と捉え、','Shared Autonomyと','知能機械の','操作学習に','取り組んでいます。']],
    sharedBody: [['搭乗者の操作と','自律支援を','組み合わせる、','電動車いすの','共有制御。'],['人と機械の','協調を、','操作と移動の','関係から','探究しています。']],
    bodyBody: [['ベルト型','インターフェースを','用いた、','体幹による','電動車いすの操作。'],['身体の個人差と','操作性能に','着目し、','身体拡張としての','移動を','研究しています。']],
    interfacePaper: [['ベルト型インターフェースを','用いた','車いすの操作性能評価']],
    sharedPaper: [['車いすの搭乗者行動適応型','力ベース共有制御']]
  };
  function composePhrases(element, sentences) {
    element.replaceChildren(...sentences.map(phrases => {
      const sentence = document.createElement('span'); sentence.className = 'copy-sentence';
      for (const phrase of phrases) {
        const span = document.createElement('span'); span.className = 'phrase'; span.textContent = phrase; sentence.append(span);
      }
      return sentence;
    }));
  }
  function t(key, values = {}) {
    let message = current === 'ja' ? ja[key] : copy[key]?.[languages.indexOf(current)-1];
    if (message === undefined) message = copy[key]?.[0] || ja[key] || key;
    return Object.entries(values).reduce((text,[name,value]) => text.replaceAll('{'+name+'}',String(value)),message);
  }
  const menu = document.querySelector('.language-menu');
  function apply(language, updateUrl = false) {
    if (!languages.includes(language)) return;
    current = language;
    document.documentElement.lang = language === 'zh' ? 'zh-Hans' : language;
    document.documentElement.dataset.language = language;
    document.getElementById('language-code').textContent = ({zh:'中文',ko:'KO'})[language] || language.toUpperCase();
    for (const binding of bindings) {
      const text = current === 'ja' ? binding.original : t(binding.key);
      if (binding.mode.startsWith('attr:')) binding.element.setAttribute(binding.mode.slice(5),text);
      else if (binding.mode === 'leading') binding.node.textContent = ' '+text.trim()+' ';
      else if (current === 'ja' && japanesePhrases[binding.key]) composePhrases(binding.element, japanesePhrases[binding.key]);
      else binding.element.textContent = text;
    }
    document.querySelectorAll('.paper-original').forEach(element => {element.hidden = language === 'ja';const caption = element.querySelector('.original-title-label');caption.textContent = t('originalTitle')+':';caption.lang = document.documentElement.lang;});
    document.title = 'Suzuki Yuma — '+t('pageTitle');
    document.querySelector('meta[name="description"]').content = t('bio');
    document.querySelectorAll('[data-language]').forEach(link => {
      if (link.tagName !== 'A') return;
      const url = new URL(location.href); url.searchParams.set('lang',link.dataset.language);link.href = url.pathname+url.search+url.hash;
      if (link.dataset.language === language) link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    });
    try {localStorage.setItem('research-preview-language',language);} catch {}
    if (updateUrl) {const url = new URL(location.href);url.searchParams.set('lang',language);history.pushState({},'',url.pathname+url.search+url.hash);}
    document.dispatchEvent(new Event('preview:language'));
  }
  const normalize = value => {const code = (value || '').toLowerCase().split('-')[0];return languages.includes(code) ? code : null;};
  let saved;try {saved = localStorage.getItem('research-preview-language');} catch {}
  const requested = new URL(location.href).searchParams.get('lang');
  const preferred = (navigator.languages || [navigator.language]).map(normalize).find(Boolean);
  window.previewI18n = {t,get language(){return current;}};
  const initialLanguage = normalize(requested) || normalize(saved) || preferred || 'en';
  apply(initialLanguage);
  menu.querySelectorAll('[data-language]').forEach(link => link.addEventListener('click',event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault(); apply(link.dataset.language,true); menu.open = false;menu.querySelector('summary').focus({preventScroll:true});
  }));
  menu.addEventListener('toggle',() => {
    if (!menu.open) return;
    document.querySelector('.appearance').open = false;
    menu.querySelectorAll('[data-language]').forEach(link => {const url = new URL(location.href);url.searchParams.set('lang',link.dataset.language);link.href = url.pathname+url.search+url.hash;});
  });
  document.addEventListener('pointerdown',event => {if (!menu.contains(event.target)) menu.open = false;},{passive:true});
  document.addEventListener('keydown',event => {if (event.key === 'Escape' && menu.open) {menu.open = false;menu.querySelector('summary').focus();}});
  addEventListener('popstate',() => apply(normalize(new URL(location.href).searchParams.get('lang')) || initialLanguage));
})();
