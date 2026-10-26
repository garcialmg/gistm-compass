// Conteúdo oficial do GISTM (Global Industry Standard on Tailings Management,
// agosto de 2020), extraído dos documentos oficiais fornecidos pelo cliente
// (global-tailings-standard_PT.pdf / global-industry-standard_EN.pdf).
// Estrutura: 6 Tópicos > 15 Princípios > 77 Requisitos.
//
// Alguns requisitos (3.4, 5.6, 5.8, 10.7, 15.1) reúnem mais de um parágrafo do
// texto original em um único requisito numerado — a paginação em duas colunas
// do PDF oficial separa o rótulo "Requisito X.Y" do corpo do texto, e a
// correspondência entre eles foi conferida cruzando as citações internas do
// próprio Padrão (ex.: "(Requisito 10.7)" no Princípio 15 confirma que a
// cláusula de capacidade financeira pertence ao Requisito 10.7).

export type TopicContent = { number: number; name: string; nameEn: string };

export type ThemeContent = {
  number: number;
  topicNumber: number;
  name: string;
  nameEn: string;
};

export type RequirementContent = {
  code: string;
  themeNumber: number;
  description: string;
  descriptionEn: string;
};

export const TOPICS: TopicContent[] = [
  { number: 1, name: "Comunidades Afetadas", nameEn: "Affected Communities" },
  { number: 2, name: "Base Integrada de Conhecimentos", nameEn: "Integrated Knowledge Base" },
  {
    number: 3,
    name: "Projeto, Construção, Operação e Monitoramento de Estruturas de Disposição de Rejeitos",
    nameEn: "Design, Construction, Operation and Monitoring of the Tailings Facility",
  },
  { number: 4, name: "Gestão e Governança", nameEn: "Management and Governance" },
  {
    number: 5,
    name: "Resposta às Emergências e Recuperação de Longo Prazo",
    nameEn: "Emergency Response and Long-term Recovery",
  },
  {
    number: 6,
    name: "Divulgação Pública e Acesso à Informação",
    nameEn: "Public Disclosure and Access to Information",
  },
];

export const THEMES: ThemeContent[] = [
  {
    number: 1,
    topicNumber: 1,
    name: "Respeitar os direitos de pessoas afetadas pelo projeto e procurar engajá-las significativamente em todas as fases do ciclo de vida das estruturas de disposição de rejeitos, inclusive na fase de fechamento.",
    nameEn:
      "Respect the rights of project-affected people and meaningfully engage them at all phases of the tailings facility lifecycle, including closure.",
  },
  {
    number: 2,
    topicNumber: 2,
    name: "Desenvolver e manter uma base de conhecimentos interdisciplinar para apoiar uma gestão segura dos rejeitos ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos, inclusive na fase de fechamento.",
    nameEn:
      "Develop and maintain an interdisciplinary knowledge base to support safe tailings management throughout the tailings facility lifecycle, including closure.",
  },
  {
    number: 3,
    topicNumber: 2,
    name: "Usar todos os elementos da base de conhecimentos – sociais, ambientais, econômicos e técnicos locais – para subsidiar decisões ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos, inclusive na fase de fechamento.",
    nameEn:
      "Use all elements of the knowledge base - social, environmental, local economic and technical - to inform decisions throughout the tailings facility lifecycle, including closure.",
  },
  {
    number: 4,
    topicNumber: 3,
    name: "Desenvolver planos e critérios de projeto para as estruturas de disposição de rejeitos no sentido de minimizar riscos em todas as fases do seu ciclo de vida, inclusive nas fases de fechamento e pós-fechamento.",
    nameEn:
      "Develop plans and design criteria for the tailings facility to minimise risk for all phases of its lifecycle, including closure and post closure.",
  },
  {
    number: 5,
    topicNumber: 3,
    name: "Desenvolver um projeto robusto que integre a base de conhecimentos e minimize o risco de falhas que possam atingir as pessoas e o meio ambiente em todas as fases do ciclo de vida das estruturas de disposição de rejeitos, inclusive nas fases de fechamento e pós-fechamento.",
    nameEn:
      "Develop a robust design that integrates the knowledge base and minimises the risk of failure to people and the environment for all phases of the tailings facility lifecycle, including closure and post-closure.",
  },
  {
    number: 6,
    topicNumber: 3,
    name: "Planejar, construir e operar a estrutura de disposição de rejeitos de modo a garantir a gestão de riscos em todas as fases do ciclo de vida das estruturas de disposição de rejeitos, incluindo nas fases de fechamento e pós-fechamento.",
    nameEn:
      "Plan, build and operate the tailings facility to manage risk at all phases of the tailings facility lifecycle, including closure and post-closure.",
  },
  {
    number: 7,
    topicNumber: 3,
    name: "Projetar, implementar e operar sistemas de monitoramento para gerenciar riscos em todas as fases do ciclo de vida das estruturas de disposição de rejeitos, inclusive na fase de fechamento.",
    nameEn:
      "Design, implement and operate monitoring systems to manage risk at all phases of the facility lifecycle, including closure.",
  },
  {
    number: 8,
    topicNumber: 4,
    name: "Estabelecer políticas, sistemas e responsabilidades para apoiar a segurança e a integridade das estruturas de disposição de rejeitos.",
    nameEn:
      "Establish policies, systems and accountabilities to support the safety and integrity of the tailings facility.",
  },
  {
    number: 9,
    topicNumber: 4,
    name: "Designar e habilitar um Engenheiro de Registro.",
    nameEn: "Appoint and empower an Engineer of Record.",
  },
  {
    number: 10,
    topicNumber: 4,
    name: "Estabelecer e implementar níveis de revisão como parte de um sistema robusto de gestão da qualidade e de riscos para todas as fases do ciclo de vida das estruturas de disposição de rejeitos, inclusive na fase de fechamento.",
    nameEn:
      "Establish and implement levels of review as part of a strong quality and risk management system for all phases of the tailings facility lifecycle, including closure.",
  },
  {
    number: 11,
    topicNumber: 4,
    name: "Desenvolver uma cultura organizacional que promova a aprendizagem, a comunicação e o reconhecimento precoce de problemas.",
    nameEn:
      "Develop an organisational culture that promotes learning, communication and early problem recognition.",
  },
  {
    number: 12,
    topicNumber: 4,
    name: "Estabelecer um processo para a apresentação de denúncias e resposta a preocupações e implementar medidas de proteção para denunciantes.",
    nameEn:
      "Establish a process for reporting and addressing concerns and implement whistleblower protections.",
  },
  {
    number: 13,
    topicNumber: 5,
    name: "Preparar-se para resposta às emergências diante de falhas nas estruturas de disposição de rejeitos.",
    nameEn: "Prepare for emergency response to tailings facility failures.",
  },
  {
    number: 14,
    topicNumber: 5,
    name: "Preparar-se para uma recuperação de longo prazo na eventualidade de uma falha catastrófica.",
    nameEn: "Prepare for long term recovery in the event of catastrophic failure.",
  },
  {
    number: 15,
    topicNumber: 6,
    name: "Divulgar publicamente e oferecer acesso a informações sobre as estruturas de disposição de rejeitos para apoiar a prestação de contas e responsabilização pública.",
    nameEn:
      "Publicly disclose and provide access to information about the tailings facility to support public accountability.",
  },
];

export const REQUIREMENTS: RequirementContent[] = [
  // Princípio 1 — Comunidades afetadas
  {
    code: "1.1",
    themeNumber: 1,
    description:
      "Para instalações existentes, o Operador pode inicialmente optar por priorizar questões relevantes de direitos humanos em conformidade com os UNGP.",
    descriptionEn:
      "For existing facilities, the Operator can initially opt to prioritise salient human rights issues in accordance with the UNGP.",
  },
  {
    code: "1.2",
    themeNumber: 1,
    description:
      "Quando uma nova estrutura de disposição de rejeitos puder afetar os direitos de povos indígenas, incluindo seus direitos à terra e recursos e seu direito à autodeterminação, trabalhar no sentido de obter e manter seu consentimento livre, prévio e informado (CLPI), demonstrando conformidade com as orientações internacionais e com as estruturas das melhores práticas reconhecidas.",
    descriptionEn:
      "Where a new tailings facility may impact the rights of indigenous or tribal peoples, including their land and resource rights and their right to self-determination, work to obtain and maintain Free Prior and Informed Consent (FPIC) by demonstrating conformance to international guidance and recognised best practice frameworks.",
  },
  {
    code: "1.3",
    themeNumber: 1,
    description:
      "Demonstrar que pessoas afetadas pelo projeto serão significativamente engajadas ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos na construção da base de conhecimentos e nas decisões que possam ter alguma relação com a segurança pública e a integridade das estruturas de disposição de rejeitos. O Operador deve compartilhar informações para apoiar esse processo.",
    descriptionEn:
      "Demonstrate that project-affected people are meaningfully engaged throughout the tailings facility lifecycle in building the knowledge base and in decisions that may have a bearing on public safety and the integrity of the tailings facility. The Operator shall share information to support this process.",
  },
  {
    code: "1.4",
    themeNumber: 1,
    description:
      "Estabelecer um mecanismo eficaz para recebimento e tratamento de queixas e denúncias no nível operacional e extrajudicial para responder a reclamações, queixas e denúncias de pessoas afetadas pelo projeto em relação à estrutura de disposição de rejeitos e apresentar soluções de acordo com os UNGP.",
    descriptionEn:
      "Establish an effective operational-level, non-judicial grievance mechanism that addresses complaints and grievances of project-affected people relating to the tailings facility, and provide remedy in accordance with the UNGP.",
  },

  // Princípio 2 — Base de conhecimentos interdisciplinar
  {
    code: "2.1",
    themeNumber: 2,
    description:
      "Desenvolver e documentar conhecimentos sobre o contexto social, ambiental e econômico local das estruturas de disposição de rejeitos, adotando abordagens alinhadas com as melhores práticas internacionais. Atualizar esses conhecimentos pelo menos a cada cinco anos e sempre que ocorrer alguma mudança relevante na estrutura de disposição de rejeitos ou no contexto social, ambiental e econômico local. Esses conhecimentos devem incorporar incertezas relacionadas a mudanças climáticas.",
    descriptionEn:
      "Develop and document knowledge about the social, environmental and local economic context of the tailings facility, using approaches aligned with international best practices. Update this knowledge at least every five years, and whenever there is a material change either to the tailings facility or to the social, environmental and local economic context. This knowledge should capture uncertainties due to climate change.",
  },
  {
    code: "2.2",
    themeNumber: 2,
    description:
      "Elaborar, documentar e atualizar uma caracterização detalhada do(s) local(is) das estruturas de disposição de rejeitos que inclua dados sobre clima, geomorfologia, geologia, geoquímica, hidrologia e hidrogeologia (vazão e qualidade das águas superficiais e subterrâneas), elementos geotécnicos e sismicidade. As propriedades físicas e químicas dos rejeitos devem ser caracterizadas e atualizadas regularmente no sentido de captar qualquer variabilidade nas propriedades e no beneficiamento dos minérios.",
    descriptionEn:
      "Prepare, document and update a detailed site characterisation of the tailings facility site(s) that includes data on climate, geomorphology, geology, geochemistry, hydrology and hydrogeology (surface and groundwater flow and quality), geotechnical, and seismicity. The physical and chemical properties of the tailings shall be characterised and updated regularly to account for variability in ore properties and processing.",
  },
  {
    code: "2.3",
    themeNumber: 2,
    description:
      "Desenvolver e documentar uma análise de formação de brechas de ruptura para a estrutura de disposição de rejeitos usando uma metodologia que considere modos de ruptura plausíveis, condições do local e propriedades dos rejeitos. Os resultados da análise devem estimar a área física impactada por uma possível falha. Quando materiais fluidos (água e sólidos liquefeitos) estiverem presentes em estruturas de disposição de rejeitos com classificação de consequências \"Alta\", \"Muito alta\" ou \"Extrema\", os resultados devem incluir estimativas da área física impactada por uma possível falha, tempos de chegada do fluxo, profundidade e velocidade e profundidade de deposição do material. Atualizar sempre que ocorrer alguma mudança relevante na estrutura de disposição de rejeitos ou na área física impactada.",
    descriptionEn:
      "Develop and document a breach analysis for the tailings facility using a methodology that considers credible failure modes, site conditions, and the properties of the slurry. The results of the analysis shall estimate the physical area impacted by a potential failure. When flowable materials (water and liquefiable solids) are present at tailings facilities with Consequence Classification of 'High', 'Very High' or 'Extreme', the results should include estimates of the physical area impacted by a potential failure, flow arrival times, depth and velocities, and depth of material deposition. Update whenever there is a material change either to the tailings facility or the physical area impacted.",
  },
  {
    code: "2.4",
    themeNumber: 2,
    description:
      "Para identificar os grupos de maior risco, usar como referência as atualizações da análise de formação de brechas de ruptura para avaliar e documentar possíveis exposições e vulnerabilidades humanas a cenários plausíveis de rupturas nas estruturas de disposição de rejeitos. Atualizar a avaliação sempre que ocorrer alguma mudança relevante na estrutura de disposição de rejeitos ou na base de conhecimentos.",
    descriptionEn:
      "In order to identify the groups most at risk, refer to the updated tailings facility breach analysis to assess and document potential human exposure and vulnerability to tailings facility credible failure scenarios. Update the assessment whenever there is a material change either to the tailings facility or to the knowledge base.",
  },

  // Princípio 3 — Usar a base de conhecimentos para decisões
  {
    code: "3.1",
    themeNumber: 3,
    description:
      "Para aumentar a resiliência às mudanças do clima, avaliar, atualizar regularmente e usar conhecimentos sobre mudanças climáticas ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos de acordo com os princípios da gestão adaptativa.",
    descriptionEn:
      "To enhance resilience to climate change, evaluate, regularly update and use climate change knowledge throughout the tailings facility lifecycle in accordance with the principles of Adaptive Management.",
  },
  {
    code: "3.2",
    themeNumber: 3,
    description:
      "Para novas estruturas de disposição de rejeitos, o Operador deve usar a base de conhecimentos e realizar uma análise multicritério de alternativas locacionais, tecnologias e estratégias viáveis para a gestão de rejeitos. O objetivo dessa análise deve ser o de: (i) selecionar uma alternativa que minimize os riscos para as pessoas e o meio ambiente ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos; e (ii) minimizar o volume de rejeitos e de água em estruturas de disposição de rejeitos externas. Essa análise deve ser revisada pelo Conselho Independente de Revisão de Rejeitos (CIRR) ou por um revisor técnico sênior independente.",
    descriptionEn:
      "For new tailings facilities, the Operator shall use the knowledge base and undertake a multi-criteria alternatives analysis of all feasible sites, technologies and strategies for tailings management. The goal of this analysis shall be to: (i) select an alternative that minimises risks to people and the environment throughout the tailings facility lifecycle; and (ii) minimise the volume of tailings and water placed in external tailings facilities. This analysis shall be reviewed by the Independent Tailings Review Board (ITRB) or a senior independent technical reviewer.",
  },
  {
    code: "3.3",
    themeNumber: 3,
    description:
      "Para estruturas de disposição de rejeitos existentes, o Operador revisará e aperfeiçoará periodicamente as tecnologias e o projeto das estruturas de disposição de rejeitos e as estratégias de gestão para minimizar riscos e melhorar os resultados ambientais. Cabe uma exceção no caso de instalações que se encontrem, comprovadamente, em uma condição de fechamento seguro.",
    descriptionEn:
      "For existing tailings facilities, the Operator shall periodically review and refine the tailings technologies and design, and management strategies to minimise risk and improve environmental outcomes. An exception applies to facilities that are demonstrated to be in a state of safe closure.",
  },
  {
    code: "3.4",
    themeNumber: 3,
    description:
      "Para novas estruturas de disposição de rejeitos, usar a base de conhecimentos, incluindo incertezas relacionadas às mudanças climáticas, para avaliar os impactos sociais, ambientais e econômicos locais das estruturas de disposição de rejeitos e possíveis falhas ao longo de todo o seu ciclo de vida. Quando avaliações de impacto preverem impactos relevantes agudos ou crônicos, o Operador elaborará, documentará e implementará planos de mitigação e gestão de impactos com base na hierarquia de mitigação. Atualizar a avaliação dos impactos sociais, ambientais e econômicos locais no sentido de que ela reflita qualquer mudança relevante que ocorra na estrutura de disposição de rejeitos ou no contexto social, ambiental e econômico local. Se novos dados indicarem que os impactos das estruturas de disposição de rejeitos mudaram substancialmente, inclusive em decorrência de conhecimentos sobre mudanças climáticas ou sobre impactos de longo prazo, o Operador deverá atualizar a gestão das estruturas de disposição de rejeitos à luz dos novos dados adotando as melhores práticas de gestão adaptativa.",
    descriptionEn:
      "For new tailings facilities, use the knowledge base, including uncertainties due to climate change, to assess the social, environmental and local economic impacts of the tailings facility and its potential failure throughout its lifecycle. Where impact assessments predict material acute or chronic impacts, the Operator shall develop, document and implement impact mitigation and management plans using the mitigation hierarchy. Update the assessment of the social, environmental and local economic impacts to reflect a material change either to the tailings facility or to the social, environmental and local economic context. If new data indicates that the impacts from the tailings facility have changed materially, including as a result of climate change knowledge or long-term impacts, the Operator shall update tailings facility management to reflect the new data using Adaptive Management best practices.",
  },

  // Princípio 4 — Planos e critérios de projeto
  {
    code: "4.1",
    themeNumber: 4,
    description:
      "Determinar a classificação das consequências de falhas nas estruturas de disposição de rejeitos avaliando as condições a jusante documentadas na base de conhecimentos e selecionando a classificação correspondente à classificação de consequências mais alta para cada categoria indicada no Anexo 2, Tabela 1. A avaliação e seleção da classificação devem se basear em modos plausíveis de ruptura e devem ser defensáveis e documentadas.",
    descriptionEn:
      "Determine the consequence of failure classification of the tailings facility by assessing the downstream conditions documented in the knowledge base and selecting the classification corresponding to the highest Consequence Classification for each category in Annex 2, Table 1. The assessment and selection of the classification shall be based on credible failure modes, and shall be defensible and documented.",
  },
  {
    code: "4.2",
    themeNumber: 4,
    description:
      "Com o objetivo de manter a flexibilidade no desenvolvimento de uma nova estrutura de disposição de rejeitos e otimizar custos e, ao mesmo tempo, priorizar a segurança ao longo de todo o ciclo de vida de estruturas de disposição de rejeitos: A. Desenvolver projetos preliminares para a estrutura de disposição de rejeitos com base em critérios de projeto para carregamento externo compatíveis com a classificação de consequências de falha selecionada com base nas condições atuais e nas classificações de consequências mais altas (inclusive \"Extrema\"). B. Informado pelo conjunto de requisitos definidos pelos projetos preliminares: 1. Implementar o projeto para os critérios de carregamento externo previstos para a classificação de consequências \"Extrema\"; ou 2. Implementar o projeto para os critérios atuais de classificação de consequências ou para critérios de uma classificação mais alta e demonstrar que a viabilidade em um nível de prova de conceito para atualização do projeto para critérios de classificação de consequências \"Extrema\" será mantida ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos. C. Se for implementada a opção B.2, revisar a classificação de consequências de falhas no momento da Revisão Periódica de Segurança de Barragens (RPSB) e pelo menos a cada cinco anos, ou antes se ocorrer alguma mudança significativa no contexto social, ambiental e econômico local, e concluir a atualização das estruturas de disposição de rejeitos à luz da nova Classificação de Consequências determinada pela RPSB dentro de um prazo de três anos. Essa revisão continuará a ser realizada até que a estrutura de disposição de rejeitos seja fechada com segurança nos termos deste Padrão. D. O processo descrito acima deve ser revisto pelo Conselho Independente de Revisão de Rejeitos (CIRR) ou pelo revisor técnico sênior independente de maneira adequada à Classificação de Consequências de falha das estruturas de disposição de rejeitos. Sujeito ao previsto no Requisito 4.7, os Requisitos 4.2.C e 4.2.D também serão aplicados a estruturas de disposição de rejeitos existentes.",
    descriptionEn:
      "With the objective of maintaining flexibility in the development of a new tailings facility and optimising costs while prioritising safety throughout the tailings facility lifecycle: A. Develop preliminary designs for the tailings facility with external loading design criteria consistent with both the consequence of failure classification selected based on current conditions and higher Consequence Classifications (including 'Extreme'). B. Informed by the range of requirements defined by the preliminary designs, either: 1. Implement the design for the 'Extreme' Consequence Classification external loading criteria; or 2. Implement the design for the current Consequence Classification criteria, or a higher one, and demonstrate that the feasibility, at a proof of concept level, to upgrade to the design for the 'Extreme' classification criteria is maintained throughout the tailings facility lifecycle. C. If option B.2 is implemented, review the consequence of failure classification at the time of the Dam Safety Review (DSR) and at least every five years, or sooner if there is a material change in the social, environmental and local economic context, and complete the upgrade of the tailings facility to the new Consequence Classification as determined by the DSR within three years. This review shall proceed until the tailings facility has been safely closed according to this Standard. D. The process described above shall be reviewed by the Independent Tailings Review Board (ITRB) or the senior independent technical reviewer, as appropriate for the tailings facility Consequence Classification. Subject to Requirement 4.7, Requirements 4.2.C and 4.2.D shall also apply to existing tailings facilities.",
  },
  {
    code: "4.3",
    themeNumber: 4,
    description:
      "O Executivo Responsável tomará a decisão de adotar um projeto para os critérios atuais de classificação de consequências e manter a flexibilidade necessária para posteriormente atualizá-lo à luz dos critérios de classificação mais altos ao longo do ciclo de vida das estruturas de disposição de rejeitos. Essa decisão deverá ser documentada.",
    descriptionEn:
      "The Accountable Executive shall take the decision to adopt a design for the current Consequence Classification criteria and to maintain flexibility to upgrade the design for the highest classification criteria later in the tailings facility lifecycle. This decision shall be documented.",
  },
  {
    code: "4.4",
    themeNumber: 4,
    description:
      "Selecionar, identificar e documentar explicitamente todos os critérios de projeto adequados para minimizar riscos para todos os modos plausíveis de ruptura para todas as fases do ciclo de vida das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Select, explicitly identify and document all design criteria that are appropriate to minimise risk for all credible failure modes for all phases of the tailings facility lifecycle.",
  },
  {
    code: "4.5",
    themeNumber: 4,
    description:
      "Aplicar critérios de projeto, como fatores de segurança para a estabilidade de taludes e gestão de infiltrações, que considerem as propriedades operacionais estimadas para os materiais e para o desempenho esperado dos elementos do projeto e a qualidade da implementação dos sistemas de gestão de riscos. Essas questões também devem ser adequadamente consideradas em projetos baseados em análises de deformação.",
    descriptionEn:
      "Apply design criteria, such as factors of safety for slope stability and seepage management, that consider estimated operational properties of materials and expected performance of design elements, and quality of the implementation of risk management systems. These issues should also be appropriately accounted for in designs based on deformation analyses.",
  },
  {
    code: "4.6",
    themeNumber: 4,
    description:
      "Identificar e abordar modos de fratura frágil com base em critérios conservadores de projeto, independentemente dos mecanismos desencadeadores, para minimizar seu impacto no desempenho das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Identify and address brittle failure modes with conservative design criteria, independent of trigger mechanisms, to minimise their impact on the performance of the tailings facility.",
  },
  {
    code: "4.7",
    themeNumber: 4,
    description:
      "Estruturas de disposição de rejeitos existentes devem observar os Requisitos previstos no Princípio 4, exceto no que se refere a aspectos em que o Engenheiro de Registro (EdR), após uma revisão do CIRR ou de um revisor técnico sênior independente, determine que a atualização da estrutura de disposição de rejeitos existente não é viável ou não pode ser aplicada retroativamente. Nesse caso, o Executivo Responsável aprovará e documentará a implementação de medidas para reduzir tanto a probabilidade como as consequências de uma falha em uma estrutura de disposição de rejeitos para reduzir os riscos a um nível tão baixo quanto razoavelmente possível (TBRP). Os pressupostos e o cronograma para realizar melhorias de estruturas de disposição de rejeitos existentes devem se basear em informações sobre riscos e ser definidos na maior brevidade possível.",
    descriptionEn:
      "Existing tailings facilities shall conform with the Requirements under Principle 4, except for those aspects where the Engineer of Record (EOR), with review by the ITRB or a senior independent technical reviewer, determines that the upgrade of an existing tailings facility is not viable or cannot be retroactively applied. In this case, the Accountable Executive shall approve and document the implementation of measures to reduce both the probability and the consequences of a tailings facility failure in order to reduce the risk to a level as low as reasonably practicable (ALARP). The basis and timing for addressing the upgrade of existing tailings facilities shall be risk-informed and carried out as soon as reasonably practicable.",
  },
  {
    code: "4.8",
    themeNumber: 4,
    description:
      "O EdR deve elaborar um Relatório de Base do Projeto (RBP) que detalhe os pressupostos e critérios do projeto, incluindo restrições operacionais, e que defina uma base para o projeto para todas as fases do ciclo de vida das estruturas de disposição de rejeitos. O RBP será revisto pelo CIRR ou pelo revisor técnico sênior independente. O EdR atualizará o RBP sempre que ocorrer alguma mudança relevante nos pressupostos do projeto, nos critérios do projeto, no projeto em si ou na base de conhecimentos e confirmará a compatibilidade interna entre esses elementos.",
    descriptionEn:
      "The EOR shall prepare a Design Basis Report (DBR) that details the design assumptions and criteria, including operating constraints, and that provides the basis for the design of all phases of the tailings facility lifecycle. The DBR shall be reviewed by the ITRB or senior independent technical reviewer. The EOR shall update the DBR every time there is a material change in the design assumptions, design criteria, design or the knowledge base and confirm internal consistency among these elements.",
  },

  // Princípio 5 — Projeto robusto
  {
    code: "5.1",
    themeNumber: 5,
    description:
      "Para novas estruturas de disposição de rejeitos, incorporar o resultado da análise multicritério de alternativas, incluindo o uso de tecnologias de disposição de rejeitos no projeto das estruturas de disposição de rejeitos.",
    descriptionEn:
      "For new tailings facilities, incorporate the outcome of the multi-criteria alternatives analysis including the use of tailings technologies in the design of the tailings facility.",
  },
  {
    code: "5.2",
    themeNumber: 5,
    description:
      "Para ampliações de estruturas de disposição de rejeitos existentes, investigar o potencial de refinamento de tecnologias de rejeitos e abordagens de projeto com vistas a minimizar riscos para as pessoas e o meio ambiente ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos.",
    descriptionEn:
      "For expansions to existing tailings facilities, investigate the potential to refine the tailings technologies and design approaches with the goal of minimising risks to people and the environment throughout the tailings facility lifecycle.",
  },
  {
    code: "5.3",
    themeNumber: 5,
    description:
      "Desenvolver um projeto robusto que considere o contexto técnico, social, ambiental e econômico local, a classificação de consequências das estruturas de disposição de rejeitos, as condições do local, a gestão hídrica, as operações da mina e questões operacionais e de construção relacionadas aos rejeitos e que demonstre a viabilidade do fechamento seguro das estruturas de disposição de rejeitos. O projeto deve ser revisado e atualizado à medida que dados sobre desempenho e sobre o local forem disponibilizados e em resposta a mudanças relevantes na estrutura de disposição de rejeitos ou no seu desempenho.",
    descriptionEn:
      "Develop a robust design that considers the technical, social, environmental and local economic context, the tailings facility Consequence Classification, site conditions, water management, mine plant operations, tailings operational and construction issues, and that demonstrates the feasibility of safe closure of the tailings facility. The design should be reviewed and updated as performance and site data become available and in response to material changes to the tailings facility or its performance.",
  },
  {
    code: "5.4",
    themeNumber: 5,
    description:
      "Desenvolver, implementar e manter o modelo de balanço hídrico e planos de gestão hídrica associados à estrutura de disposição de rejeitos, levando em consideração a base de conhecimentos, incluindo conhecimentos sobre mudanças climáticas, bacias hidrológicas e hidrogeológicas a montante e a jusante, o local da mina, o planejamento da mina e as operações gerais e a integridade das estrutura de disposição de rejeitos ao longo de todo o seu ciclo de vida. O programa de gestão hídrica deve ser elaborado de modo a oferecer proteção contra descargas não intencionais.",
    descriptionEn:
      "Develop, implement and maintain a water balance model and associated water management plans for the tailings facility, taking into account the knowledge base including climate change, upstream and downstream hydrological and hydrogeological basins, the mine site, mine planning and overall operations and the integrity of the tailings facility throughout its lifecycle. The water management programme must be designed to protect against unintentional releases.",
  },
  {
    code: "5.5",
    themeNumber: 5,
    description:
      "Considerar todos os modos plausíveis de rupturas na estrutura, sua fundação, ombreiras, reservatório (depósito e lagoa de rejeitos), borda do reservatório e estruturas auxiliares para minimizar o risco a um nível tão baixo quanto razoavelmente possível (TBRP). Avaliações de riscos devem ser usadas para subsidiar o projeto.",
    descriptionEn:
      "Address all potential failure modes of the structure, its foundation, abutments, reservoir (tailings deposit and pond), reservoir rim and appurtenant structures to minimise risk to ALARP. Risk assessments must be used to inform the design.",
  },
  {
    code: "5.6",
    themeNumber: 5,
    description:
      "Desenvolver um projeto para cada estágio de construção da estrutura de disposição de rejeitos, incluindo, sem limitação, o dique de partida, alteamentos parciais e configurações provisórias, alteamento final e todos os estágios de fechamento. Projetar a fase de fechamento de uma maneira que cumpra todos os Requisitos do Padrão com detalhamento suficiente para demonstrar a viabilidade do cenário de fechamento e permitir a implementação de elementos do projeto durante a sua construção e operação, conforme o caso. O projeto deve incluir o fechamento progressivo e a reabilitação durante as operações.",
    descriptionEn:
      "Develop a design for each stage of construction of the tailings facility, including but not limited to start-up, partial raises and interim configurations, final raise, and all closure stages. Design the closure phase in a manner that meets all the Requirements of the Standard with sufficient detail to demonstrate the feasibility of the closure scenario and to allow implementation of elements of the design during construction and operation as appropriate. The design should include progressive closure and reclamation during operations.",
  },
  {
    code: "5.7",
    themeNumber: 5,
    description:
      "Para uma proposta de nova estrutura de disposição de rejeitos classificada como de consequência \"Alta\", \"Muito Alta\" ou \"Extrema\", o Executivo Responsável deve confirmar que o projeto satisfaz o requisito de minimizar os riscos a um nível tão baixo quanto razoavelmente possível (TBRP) e aprovar medidas razoáveis adicionais que possam ser tomadas a jusante no sentido de reduzir ainda mais possíveis consequências para as pessoas e o meio ambiente. O Executivo Responsável deve explicar e documentar as decisões tomadas em relação à minimização dos riscos a um nível tão baixo quanto razoavelmente possível (TBRP) e a medidas adicionais a serem tomadas para reduzir as consequências.",
    descriptionEn:
      "For a proposed new tailings facility classified as 'High', 'Very High' or 'Extreme', the Accountable Executive shall confirm that the design satisfies ALARP and shall approve additional reasonable steps that may be taken downstream, to further reduce potential consequences to people and the environment. The Accountable Executive shall explain and document the decisions with respect to ALARP and additional consequence reduction measures.",
  },
  {
    code: "5.8",
    themeNumber: 5,
    description:
      "Para uma estrutura de disposição de rejeitos existente classificada como de consequência \"Alta\", \"Muito Alta\" ou \"Extrema\", o Executivo Responsável, ao realizar cada RPSB ou pelo menos a cada cinco anos, deve confirmar que o projeto cumpre o requisito de minimizar os riscos a um nível tão baixo quanto razoavelmente possível (TBRP) e procurará identificar e implementar medidas razoáveis adicionais que possam ser tomadas para reduzir possíveis consequências para as pessoas e o meio ambiente. O Executivo Responsável deve explicar e documentar suas decisões em relação a minimizar os riscos a um nível tão baixo quanto razoavelmente possível (TBRP) e a medidas adicionais de redução de consequências, em regime de consultas às partes externas quando pertinente. Quando outras medidas para reduzir as consequências de um modo de falha plausível em uma estrutura de disposição de rejeitos tomadas com base na análise de formação de brechas de ruptura tiverem se esgotado e o reassentamento preventivo não puder ser evitado, o Operador deve demonstrar conformidade com as normas internacionais para o reassentamento involuntário.",
    descriptionEn:
      "For an existing tailings facility classified as 'High', 'Very High' or 'Extreme', the Accountable Executive, at the time of every DSR or at least every five years, shall confirm that the design satisfies ALARP and shall seek to identify and implement additional reasonable steps that may be taken to further reduce potential consequences to people and the environment. The Accountable Executive shall explain and document the decisions with respect to ALARP and additional consequence reduction measures, in consultation with external parties as appropriate. Where other measures to reduce the consequences of a tailings facility credible failure mode as per the breach analysis have been exhausted, and pre-emptive resettlement cannot be avoided, the Operator shall demonstrate conformance with international standards for involuntary resettlement.",
  },

  // Princípio 6 — Construir e operar gerenciando riscos
  {
    code: "6.1",
    themeNumber: 6,
    description:
      "Construir, operar, monitorar e fechar a estrutura de disposição de rejeitos de acordo com a intenção do projeto em todas as fases do ciclo de vida das estruturas de disposição de rejeitos, usando pessoal qualificado e metodologia, equipamentos, procedimentos e métodos de aquisição de dados adequados, bem como o Sistema de Gestão de Disposição de Rejeitos (SGDR) e o Sistema de Gestão Ambiental e Social (SGAS) geral para a mina e para a infraestrutura associada.",
    descriptionEn:
      "Build, operate, monitor and close the tailings facility according to the design intent at all phases of the tailings facility lifecycle, using qualified personnel and appropriate methodology, equipment and procedures, data acquisition methods, the Tailings Management System (TMS) and the overall Environmental and Social Management System (ESMS) for the mine and associated infrastructure.",
  },
  {
    code: "6.2",
    themeNumber: 6,
    description:
      "Gerenciar a qualidade e adequação do processo de construção e operação implementando mecanismos de Controle de Qualidade, Garantia de Qualidade e Aderência do Projeto x Obra (APO). O Operador deve usar a APO para garantir que a intenção do projeto seja implementada e continue a ser cumprida caso as condições do local apresentem variações em relação aos pressupostos do projeto.",
    descriptionEn:
      "Manage the quality and adequacy of the construction and operation process by implementing Quality Control, Quality Assurance and Construction vs Design Intent Verification (CDIV). The Operator shall use the CDIV to ensure that the design intent is implemented and is still being met if the site conditions vary from the design assumptions.",
  },
  {
    code: "6.3",
    themeNumber: 6,
    description:
      "Elaborar um Relatório de Registro de Construção (relatório \"como construído\" [as-built]) sempre que ocorrer alguma mudança relevante na estrutura de disposição de rejeitos, na sua infraestrutura ou no seu sistema de monitoramento. O EdR e o Responsável Técnico pelas estruturas de disposição de rejeitos (RTER) assinarão esse relatório.",
    descriptionEn:
      "Prepare a detailed Construction Records Report ('as-built' report) whenever there is a material change to the tailings facility, its infrastructure or its monitoring system. The EOR and the Responsible Tailings Facility Engineer (RTFE) shall sign this report.",
  },
  {
    code: "6.4",
    themeNumber: 6,
    description:
      "Desenvolver, implementar, revisar anualmente e atualizar, conforme o caso, um Manual de Operações, Manutenção e Vigilância (OMV) para apoiar a gestão eficaz de riscos como parte do SGDR. O Manual OMV deve seguir as melhores práticas, descrever claramente o contexto e prever controles críticos para operações seguras e ser revisado para garantir sua eficácia. O RTER proporcionará acesso ao Manual OMV e a um programa de treinamento para funcionários de todos os níveis envolvidos no SGDR com o apoio do EdR.",
    descriptionEn:
      "Develop, implement, review annually and update as required an Operations, Maintenance and Surveillance (OMS) Manual that supports effective risk management as part of the TMS. The OMS Manual should follow best practices, clearly provide the context and critical controls for safe operations, and be reviewed for effectiveness. The RTFE shall provide access to the OMS Manual and training to all levels of personnel involved in the TMS with support from the EOR.",
  },
  {
    code: "6.5",
    themeNumber: 6,
    description:
      "Implementar um sistema de gestão de mudanças formal para acionar processos de avaliação, revisão, aprovação e documentação de mudanças no projeto, na construção, na operação ou no monitoramento ao longo do ciclo de vida das estruturas de disposição de rejeitos. O sistema de gestão de mudanças incluirá também o requisito de que o EdR elabore um Relatório de Avaliação de Alterações (RAA) que apresente uma avaliação do impacto cumulativo de mudanças no nível dos riscos representados pela instalação construída. O RAA apresentará recomendações para a gestão de riscos, se necessário, e quaisquer atualizações resultantes para o projeto, o RBP, o OMV e o programa de monitoramento. O RAA deverá ser aprovado pelo Executivo Responsável.",
    descriptionEn:
      "Implement a formal change management system that triggers the evaluation, review, approval and documentation of changes to design, construction, operation or monitoring during the tailings facility lifecycle. The change management system shall also include the requirement for the EOR to prepare a periodic Deviance Accountability Report (DAR), that provides an assessment of the cumulative impact of the changes on the risk level of the as-constructed facility. The DAR shall provide recommendations for managing risk, if necessary, and any resulting updates to the design, DBR, OMS and the monitoring programme. The DAR shall be approved by the Accountable Executive.",
  },
  {
    code: "6.6",
    themeNumber: 6,
    description:
      "Incorporar tecnologias e abordagens novas e emergentes e usar novos conhecimentos para aprimorar o projeto, a construção e a operação das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Include new and emerging technologies and approaches and use the evolving knowledge in the refinement of the design, construction and operation of the tailings facility.",
  },

  // Princípio 7 — Monitoramento
  {
    code: "7.1",
    themeNumber: 7,
    description:
      "Projetar, implementar e operar um programa abrangente e integrado de monitoramento de desempenho para a estrutura de disposição de rejeitos e suas estruturas auxiliares como parte do SGDR e para os aspectos do SGAS relacionados, de acordo com os princípios da Gestão Adaptativa.",
    descriptionEn:
      "Design, implement and operate a comprehensive and integrated performance monitoring programme for the tailings facility and its appurtenant structures as part of the TMS and for those aspects of the ESMS related to the tailings facility in accordance with the principles of Adaptive Management.",
  },
  {
    code: "7.2",
    themeNumber: 7,
    description:
      "Projetar, implementar e operar um sistema de monitoramento de engenharia abrangente e integrado que seja adequado para verificar os pressupostos do projeto e monitorar potenciais modos de falha. O método observacional deve ser plenamente adotado para modos de ruptura não frágil (dúctil). Os modos de ruptura frágil (rúptil) são abordados por critérios conservadores de projeto.",
    descriptionEn:
      "Design, implement and operate a comprehensive and integrated engineering monitoring system that is appropriate for verifying design assumptions and for monitoring potential failure modes. Full implementation of the Observational Method shall be adopted for non-brittle failure modes. Brittle failure modes are addressed by conservative design criteria.",
  },
  {
    code: "7.3",
    themeNumber: 7,
    description:
      "Estabelecer objetivos, indicadores, critérios e parâmetros de desempenho específicos e mensuráveis e incluí-los no projeto de programas de monitoramento que medem o desempenho ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos. Registrar e avaliar os dados na frequência adequada. Com base nos dados obtidos, atualizar os programas de monitoramento ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos para confirmar que eles continuam sendo eficazes para gerir riscos.",
    descriptionEn:
      "Establish specific and measurable performance objectives, indicators, criteria, and performance parameters and include them in the design of the monitoring programmes that measure performance throughout the tailings facility lifecycle. Record and evaluate the data at appropriate frequencies. Based on the data obtained, update the monitoring programmes throughout the tailings facility lifecycle to confirm that they remain effective to manage risk.",
  },
  {
    code: "7.4",
    themeNumber: 7,
    description:
      "Analisar os dados do monitoramento técnico na frequência recomendada pelo EdR e avaliar o desempenho das estruturas de disposição de rejeitos, identificando claramente e apresentando evidências de quaisquer desvios do desempenho esperado e de qualquer deterioração no desempenho ao longo do tempo. Relatar evidências prontamente para o EdR para que ele revise e atualize a avaliação de riscos e o projeto, se necessário. Se for identificada qualquer evidência de desempenho fora das faixas esperadas, o plano de ativação de ações de resposta (PAAR) ou controles críticos devem ser acionados imediatamente.",
    descriptionEn:
      "Analyse technical monitoring data at the frequency recommended by the EOR, and assess the performance of the tailings facility, clearly identifying and presenting evidence on any deviations from the expected performance and any deterioration of the performance over time. Promptly submit evidence to the EOR for review and update the risk assessment and design, if required. Performance outside the expected ranges shall be addressed promptly through Trigger Action Response Plans (TARPs) or critical controls.",
  },
  {
    code: "7.5",
    themeNumber: 7,
    description:
      "Relatar os resultados de cada programa de monitoramento na frequência necessária para cumprir requisitos regulatórios e da empresa pelo menos uma vez por ano. O RTER e o EdR revisarão e aprovarão os relatórios técnicos de monitoramento.",
    descriptionEn:
      "Report the results of each of the monitoring programmes at the frequency required to meet company and regulatory requirements and, at a minimum, on an annual basis. The RTFE and the EOR shall review and approve the technical monitoring reports.",
  },

  // Princípio 8 — Políticas, sistemas e responsabilidades
  {
    code: "8.1",
    themeNumber: 8,
    description:
      "O Conselho de Administração adotará e publicará uma política ou compromisso de gestão segura das estruturas de disposição de rejeitos, de preparação e resposta a emergências e de recuperação após alguma falha.",
    descriptionEn:
      "The Board of Directors shall adopt and publish a policy on or commitment to the safe management of tailings facilities, to emergency preparedness and response, and to recovery after failure.",
  },
  {
    code: "8.2",
    themeNumber: 8,
    description:
      "Estabelecer uma estrutura de governança de rejeitos e um SGDR baseado em desempenho e garantir que o SGAS e outros sistemas críticos abranjam aspectos relevantes da gestão das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Establish a tailings governance framework and a performance based TMS and ensure that the ESMS and other critical systems encompass relevant aspects of the tailings facility management.",
  },
  {
    code: "8.3",
    themeNumber: 8,
    description:
      "Para funções com responsabilidade sobre estruturas de disposição de rejeitos, desenvolver mecanismos para que incentivos financeiros ou revisões de desempenho se baseiem, ao menos parcialmente, na segurança pública e na integridade das estruturas de disposição de rejeitos. Esses incentivos financeiros devem refletir o grau em que a segurança pública e a integridade das estruturas de disposição de rejeitos fazem parte da função. Incentivos de longo prazo para gerentes executivos relevantes devem levar em consideração a gestão de rejeitos.",
    descriptionEn:
      "For roles with responsibility for tailings facilities, develop mechanisms such that incentive payments or performance reviews are based, at least in part, on public safety and the integrity of the tailings facility. These incentive payments shall reflect the degree to which public safety and the integrity of the tailings facility are part of the role. Long-term incentives for relevant executive managers should take tailings management into account.",
  },
  {
    code: "8.4",
    themeNumber: 8,
    description:
      "Designar um ou mais Executivos Responsáveis diretamente subordinado(s) ao diretor executivo para questões relacionadas a este Padrão. O(s) Executivo(s) Responsável(is) responderá(ão) pela segurança das estruturas de disposição de rejeitos e terá(ão) a responsabilidade de evitar ou minimizar as consequências sociais e ambientais de alguma falha na estrutura de disposição de rejeitos. O(s) Executivo(s) Responsável(is) também será(ão) responsável(is) por um programa de treinamento na gestão de rejeitos e de preparação e resposta às emergências. O(s) Executivo(s) Responsável(is) deverão manter comunicações programadas com o EdR e comunicações regulares com o Conselho de Administração que poderão ser iniciadas pelo(s) Executivo(s) Responsável(is) ou pelo Conselho. O Conselho documentará como ele responsabiliza o(s) Executivo(s) Responsável(is).",
    descriptionEn:
      "Appoint one or more Accountable Executives who is/are directly answerable to the CEO on matters related to this Standard. The Accountable Executive(s) shall be accountable for the safety of tailings facilities and for avoiding or minimising the social and environmental consequences of a tailings facility failure. The Accountable Executive(s) shall also be accountable for a programme of tailings management training, and for emergency preparedness and response. The Accountable Executive(s) must have scheduled communication with the EOR and regular communication with the Board of Directors, which can be initiated either by the Accountable Executive(s), or the Board. The Board of Directors shall document how it holds the Accountable Executive(s) accountable.",
  },
  {
    code: "8.5",
    themeNumber: 8,
    description:
      "Designar um Engenheiro Responsável pelas Estruturas de disposição de rejeitos (RTER) responsável por garantir a integridade das estruturas de disposição de rejeitos, fazer a ligação com o EdR e com equipes internas como as de operações, planejamento, questões regulatórias, desempenho social e meio ambiente e manter uma comunicação regular em duas vias com o Executivo Responsável. O RTER deve estar familiarizado com o RBP, com o relatório do projeto e com a construção e desempenho das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Appoint a site-specific Responsible Tailings Facility Engineer (RTFE) who is accountable for the integrity of the tailings facility, who liaises with the EOR and internal teams such as operations, planning, regulatory affairs, social performance and environment, and who has regular two-way communication with the Accountable Executive. The RTFE must be familiar with the DBR, the design report and the construction and performance of the tailings facility.",
  },
  {
    code: "8.6",
    themeNumber: 8,
    description:
      "Identificar requisitos adequados para qualificação e experiência de todos os funcionários que desempenhem funções críticas de segurança na operação de uma estrutura de disposição de rejeitos, incluindo, sem limitação, o RTER, o EdR e o Executivo Responsável. Garantir que as pessoas que desempenham essas funções tenham as qualificações e a experiência identificadas e desenvolver planos de sucessão para esses funcionários.",
    descriptionEn:
      "Identify appropriate qualifications and experience requirements for all personnel who play safety-critical roles in the operation of a tailings facility, including, but not limited to the RTFE, the EOR and the Accountable Executive. Ensure that incumbents of these roles have the identified qualifications and experience, and develop succession plans for these personnel.",
  },
  {
    code: "8.7",
    themeNumber: 8,
    description:
      "Contratar uma empresa de engenharia com expertise e experiência em projetos e na construção de estruturas de disposição de rejeitos de complexidade comparável para prestar serviços ao EdR na operação das estruturas de disposição de rejeitos e de instalações fechadas com classificação de consequências \"Alta\", \"Muito Alta\" e \"Extrema\" que estiverem na fase ativa de fechamento. Exigir que a empresa designe um engenheiro sênior, aprovado pelo Operador, para representar a empresa como EdR e verificar se o indivíduo possui a experiência e as habilidades necessárias e se dispõe do tempo necessário para desempenhar essa função. Como alternativa, o Operador poderá designar um engenheiro da própria empresa com a expertise e a experiência necessárias em instalações comparáveis para exercer a função de EdR. Nesse caso, o EdR poderá delegar o projeto a uma empresa (\"Projetista de Registro\" - PdR), mas ele deverá se manter plenamente a par do projeto no exercício das suas responsabilidades como EdR. Independentemente de serem designados a partir dos quadros da empresa ou externamente, o EdR ou o PdR devem ser competentes e ter experiência compatível com a classificação de consequências e a complexidade das estruturas de disposição de rejeitos em questão.",
    descriptionEn:
      "Engage an engineering firm with expertise and experience in the design and construction of tailings facilities of comparable complexity to provide EOR services for operating the tailings facility and for closed facilities with 'High', 'Very High' and 'Extreme' Consequence Classification, that are in the active closure phase. Require that the firm nominate a senior engineer, approved by the Operator, to represent the firm as the EOR, and verify that the individual has the necessary experience, skills and time to fulfil this role. Alternatively, the Operator may appoint an in-house engineer with expertise and experience in comparable facilities as the EOR. In this instance, the EOR may delegate the design to a firm ('Designer of Record') but shall remain thoroughly familiar with the design in discharging their responsibilities as EOR. Whether the EOR or the DOR is in-house or external, they must be competent and have experience appropriate to the Consequence Classification and complexity of the tailings facility.",
  },

  // Princípio 9 — Engenheiro de Registro
  {
    code: "9.1",
    themeNumber: 9,
    description:
      "Habilitar o EdR por meio de um contrato por escrito que descreva claramente sua autoridade, função e responsabilidades ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos e durante processos de transferência de propriedade da mina. O contrato por escrito deve descrever claramente as obrigações do Operador perante o EdR para apoiar o desempenho eficaz do EdR.",
    descriptionEn:
      "Empower the EOR through a written agreement that clearly describes their authority, role and responsibilities throughout the tailings facility lifecycle, and during change of ownership of mining properties. The written agreement must clearly describe the obligations of the Operator to the EOR, to support the effective performance of the EOR.",
  },
  {
    code: "9.2",
    themeNumber: 9,
    description:
      "Estabelecer e implementar um programa de gestão da qualidade para todas as obras de engenharia, as interações entre o EdR, o RTER e o Executivo Responsável e o seu envolvimento no ciclo de vida das estruturas de disposição de rejeitos conforme a necessidade para confirmar que a implementação e a intenção do projeto estão sendo observadas.",
    descriptionEn:
      "Establish and implement a programme to manage the quality of all engineering work, the interactions between the EOR, the RTFE and the Accountable Executive, and their involvement in the tailings facility lifecycle as necessary to confirm that both the implementation of the design and the design intent are met.",
  },
  {
    code: "9.3",
    themeNumber: 9,
    description:
      "Considerando seu possível impacto nos riscos associados a uma estrutura de disposição de rejeitos, a seleção do EdR deverá ser decidida pelo Executivo Responsável e informada, mas não decidida, pelo pessoal da empresa responsável pela área de compras e contratações.",
    descriptionEn:
      "Given its potential impact on the risks associated with a tailings facility, the selection of the EOR shall be decided by the Accountable Executive and informed, but not decided, by procurement personnel.",
  },
  {
    code: "9.4",
    themeNumber: 9,
    description:
      "Caso seja necessário substituir o EdR (quer ele seja externo ou do quadro da empresa), desenvolver um plano detalhado para uma transferência completa de dados, informações, conhecimentos e experiência com os procedimentos de construção e com os materiais usados nas obras.",
    descriptionEn:
      "Where it becomes necessary to change the EOR (whether a firm or an in-house employee), develop a detailed plan for the comprehensive transfer of data, information, knowledge and experience with the construction procedures and materials.",
  },
  {
    code: "9.5",
    themeNumber: 9,
    description:
      "Para estruturas de disposição de rejeitos com classificação de consequências \"Muito Alta\" ou \"Extrema\", estabelecer um Conselho Independente de Revisão de Rejeitos (CIRR). Para todas as demais instalações, o Operador poderá designar um revisor técnico sênior independente. O CIRR ou o revisor deverão ser designados nos estágios iniciais do processo de desenvolvimento do projeto, ser subordinados ao Executivo Responsável e certificar por escrito que seguem as melhores práticas estabelecidas para engenheiros para evitar conflitos de interesse.",
    descriptionEn:
      "For tailings facilities with Consequence Classification of 'Very High' or 'Extreme', appoint an Independent Tailings Review Board (ITRB). For all other facilities, the Operator may appoint a senior independent technical reviewer. The ITRB or the reviewer shall be appointed early in the project development process, report to the Accountable Executive and certify in writing that they follow best practices for engineers in avoiding conflicts of interest.",
  },

  // Princípio 10 — Níveis de revisão
  {
    code: "10.1",
    themeNumber: 10,
    description:
      "Realizar e atualizar avaliações de riscos com uma equipe multidisciplinar qualificada, usando metodologias baseadas nas melhores práticas, a intervalos de pelo menos três anos e com frequência maior sempre que ocorrer alguma mudança relevante na estrutura de disposição de rejeitos ou no contexto social, ambiental e econômico local. Transmitir as avaliações de risco ao CIRR ou ao revisor técnico sênior independente para revisão e considerar, em regime de urgência, todos os aspectos inaceitáveis que possam acarretar riscos para a estrutura de disposição de rejeitos.",
    descriptionEn:
      "Conduct and update risk assessments with a qualified multi-disciplinary team using best practice methodologies at a minimum every three years and more frequently whenever there is a material change either to the tailings facility or to the social, environmental and local economic context. Transmit risk assessments to the ITRB or senior independent technical reviewer for review, and address with urgency all unacceptable tailings facility risks.",
  },
  {
    code: "10.2",
    themeNumber: 10,
    description:
      "Revisar regularmente o SGDR e os componentes do SGAS relacionados à estrutura de disposição de rejeitos para garantir a eficácia dos sistemas de gestão. Documentar e relatar os resultados ao Executivo Responsável, ao Conselho de Administração e às pessoas afetadas pelo projeto. A revisão deve ser realizada por revisores técnicos sênior dotados das qualificações, da expertise e dos recursos adequados. Para estruturas de disposição de rejeitos com classificação de consequências \"Alta\", \"Muito alta\" ou \"Extrema\", a revisão deve ser feita pelo menos a cada três anos.",
    descriptionEn:
      "Conduct regular reviews of the TMS and of the components of the ESMS that refer to the tailings facility to assure the effectiveness of the management systems. Document and report the outcomes to the Accountable Executive, Board of Directors and project-affected people. The review shall be undertaken by senior technical reviewers with the appropriate qualifications, expertise and resources. For tailings facilities with 'High', 'Very High' or 'Extreme' Consequence Classification, conduct the review at least every three years.",
  },
  {
    code: "10.3",
    themeNumber: 10,
    description:
      "Realizar auditorias internas para verificar a implementação sistemática dos procedimentos e diretrizes estabelecidos pela empresa e a observância dos requisitos de governança corporativa de acordo com o SGDR e à luz de aspectos do SGAS desenvolvidos para a gestão de riscos da estrutura de disposição de rejeitos.",
    descriptionEn:
      "Conduct internal audits to verify consistent implementation of company procedures, guidelines and corporate governance requirements consistent with the TMS and aspects of the ESMS developed to manage tailings facility risks.",
  },
  {
    code: "10.4",
    themeNumber: 10,
    description:
      "O EdR ou revisor técnico sênior independente realizarão revisões da construção e desempenho das estruturas de disposição de rejeitos anualmente ou a intervalos menores, se necessário.",
    descriptionEn:
      "The EOR or senior independent technical reviewer shall conduct tailings facility construction and performance reviews annually or more frequently, if required.",
  },
  {
    code: "10.5",
    themeNumber: 10,
    description:
      "Realizar um RPSB independente pelo menos a cada cinco anos para estruturas de disposição de rejeitos com classificação de consequências \"Muito Alta\" ou \"Extrema\" e pelo menos a cada 10 anos para todas as demais instalações. Para estruturas de disposição de rejeitos com condições ou desempenho complexos, o CIRR pode recomendar RPSB mais frequentes. O RPSB abrangerá aspectos técnicos, operacionais e de governança das estruturas de disposição de rejeitos e deverá ser realizada com base nas melhores práticas. O engenheiro independente contratado para realizar o RPSB não poderá realizar RPSB consecutivas em uma mesma estrutura de disposição de rejeitos e certificará por escrito que está seguindo as melhores práticas estabelecidas para engenheiros para evitar conflitos de interesse.",
    descriptionEn:
      "Conduct an independent DSR at least every five years for tailings facilities with 'Very High' or 'Extreme' Consequence Classifications and at least every 10 years for all other facilities. For tailings facilities with complex conditions or performance, the ITRB may recommend more frequent DSRs. The DSR shall include technical, operational and governance aspects of the tailings facility and shall be completed according to best practices. The DSR contractor cannot conduct consecutive DSRs on the same tailings facility and shall certify in writing that they follow best practices for engineers in avoiding conflicts of interest.",
  },
  {
    code: "10.6",
    themeNumber: 10,
    description:
      "Para estruturas de disposição de rejeitos com classificação de consequências \"Muito Alta\" ou \"Extrema\", o CIRR, em subordinação ao Executivo Responsável, apresentará revisões independentes sênior permanentes do planejamento, localização, projeto, construção, operação, balanço hídrico e de massa, manutenção, monitoramento, desempenho e gestão de riscos a intervalos adequados em todas as fases do ciclo de vida das estruturas de disposição de rejeitos. Para estruturas de disposição de rejeitos com outra classificação de consequências, essa revisão poderá ser realizada por um revisor técnico sênior independente.",
    descriptionEn:
      "For tailings facilities with 'Very High' or 'Extreme' Consequence Classifications, the ITRB, reporting to the Accountable Executive shall provide ongoing senior independent review of the planning, siting, design, construction, operation, water and mass balance, maintenance, monitoring, performance and risk management at appropriate intervals across all phases of the tailings facility lifecycle. For tailings facilities with other Consequence Classifications, this review can be done by a senior independent technical reviewer.",
  },
  {
    code: "10.7",
    themeNumber: 10,
    description:
      "O valor dos custos estimados para o fechamento planejado, o fechamento antecipado, a reabilitação e o pós-fechamento das estruturas de disposição de rejeitos e de suas estruturas auxiliares será revisto periodicamente para confirmar a disponibilidade de capacidade financeira adequada (incluindo seguros, no limite comercialmente razoável) para esses fins ao longo de todo o ciclo de vida das estruturas de disposição de rejeitos. As conclusões dessa revisão serão publicadas anualmente. Essas conclusões poderão ser divulgadas em demonstrações financeiras auditadas ou em documentos públicos de divulgação obrigatória de acordo com a legislação. Sujeito às disposições de regulações locais ou nacionais sobre essa matéria, os Operadores envidarão todos os esforços possíveis para avaliar e levar em consideração a capacidade de um adquirente de qualquer dos seus ativos que envolvam uma estrutura de disposição de rejeitos (por meio de uma fusão, aquisição ou outra transferência de propriedade) de continuar a observar este Padrão durante todo o ciclo de vida das estruturas de disposição de rejeitos.",
    descriptionEn:
      "The amount of estimated costs for planned closure, early closure, reclamation, and post-closure of the tailings facility and its appurtenant structures shall be reviewed periodically to confirm that adequate financial capacity (including insurance, to the extent commercially reasonable) is available for such purposes throughout the tailings facility lifecycle, and the conclusions of the review shall be publicly disclosed annually. Disclosure may be made in audited financial statements or in public regulatory filings. Subject to the provisions of local or national regulations on this matter, Operators shall use best efforts to assess and take into account the capability of an acquirer of any of its assets involving a tailings facility (through merger, acquisition, or other change in ownership) to maintain this Standard for the tailings facility lifecycle.",
  },

  // Princípio 11 — Cultura organizacional
  {
    code: "11.1",
    themeNumber: 11,
    description:
      "Educar funcionários que desempenhem alguma função em qualquer fase do ciclo de vida das estruturas de disposição de rejeitos sobre como seus procedimentos e responsabilidades na sua função estão relacionados à prevenção de uma falha.",
    descriptionEn:
      "Educate personnel who have a role in any phase of the tailings facility lifecycle about how their job procedures and responsibilities relate to the prevention of a failure.",
  },
  {
    code: "11.2",
    themeNumber: 11,
    description:
      "Estabelecer mecanismos que incorporem conhecimentos baseados na experiência dos trabalhadores ao planejamento, projeto e operações em todas as fases do ciclo de vida das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Establish mechanisms that incorporate workers' experience-based knowledge into planning, design and operations for all phases of the tailings facility lifecycle.",
  },
  {
    code: "11.3",
    themeNumber: 11,
    description:
      "Estabelecer mecanismos que promovam a colaboração interfuncional para garantir o compartilhamento eficaz de dados e conhecimentos, uma comunicação efetiva e a implementação adequada de medidas de gestão para apoiar a segurança pública e a integridade das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Establish mechanisms that promote cross-functional collaboration to ensure effective data and knowledge sharing, communication and implementation of management measures to support public safety and the integrity of the tailings facility.",
  },
  {
    code: "11.4",
    themeNumber: 11,
    description:
      "Identificar e implementar lições aprendidas com investigações internas sobre incidentes e relatórios externos relevantes sobre incidentes, considerando, especialmente, fatores humanos e organizacionais.",
    descriptionEn:
      "Identify and implement lessons from internal incident investigations and relevant external incident reports, paying particular attention to human and organisational factors.",
  },
  {
    code: "11.5",
    themeNumber: 11,
    description:
      "Estabelecer mecanismos que reconheçam, recompensem e protejam contra retaliações funcionários e empreiteiros que denunciem problemas ou identifiquem oportunidades para melhorar a gestão das estruturas de disposição de rejeitos. Responder em tempo hábil e comunicar as medidas tomadas e os seus resultados.",
    descriptionEn:
      "Establish mechanisms that recognise, reward and protect from retaliation, employees and contractors who report problems or identify opportunities for improving tailings facility management. Respond in a timely manner and communicate actions taken and their outcomes.",
  },

  // Princípio 12 — Denúncias e proteção a denunciantes
  {
    code: "12.1",
    themeNumber: 12,
    description:
      "O Executivo Responsável estabelecerá um processo formal, confidencial e por escrito para receber, investigar e responder prontamente às preocupações levantadas por funcionários e contratados sobre possíveis violações de licenças e autorizações ou outras questões relacionadas à conformidade legal, à segurança pública, à integridade das estruturas de disposição de rejeitos ou ao meio ambiente.",
    descriptionEn:
      "The Accountable Executive shall establish a formal, confidential and written process to receive, investigate and promptly address concerns from employees and contractors about possible permit violations or other matters relating to regulatory compliance, public safety, tailings facility integrity or the environment.",
  },
  {
    code: "12.2",
    themeNumber: 12,
    description:
      "Em conformidade com as melhores práticas internacionais de proteção a denunciantes, o Operador não deverá demitir, discriminar ou adotar qualquer represália contra um denunciante que, de boa-fé, tenha denunciado possíveis violações de licenças ou autorizações ou levantado outras questões relacionadas à conformidade legal, à segurança pública, à integridade das estruturas de disposição de rejeitos ou ao meio ambiente.",
    descriptionEn:
      "In accordance with international best practices for whistleblower protection, the Operator shall not discharge, discriminate against, or otherwise retaliate in any way against a whistleblower who, in good faith, has reported possible permit violations or other matters relating to regulatory compliance, public safety, tailings facility integrity or the environment.",
  },

  // Princípio 13 — Resposta a emergências
  {
    code: "13.1",
    themeNumber: 13,
    description:
      "Como parte do SGDR, adotar melhores práticas e expertise em respostas às emergências para elaborar e implementar um Plano de Preparação e Resposta às Emergências (PPRE) baseado em cenários de falha plausíveis de fluxo e na avaliação de possíveis consequências. Testar e atualizar o PPRE em todas as fases do ciclo de vida das estruturas de disposição de rejeitos na frequência estabelecida no plano ou a intervalos menores se essa necessidade for acionada por uma mudança relevante nas estruturas de disposição de rejeitos ou no contexto social, ambiental e econômico local. Engajar significativamente funcionários e contratados na coleta de informações para a elaboração do PPRE e desenvolver medidas de preparação para emergências focadas na comunidade conjuntamente com as pessoas afetadas pelo projeto.",
    descriptionEn:
      "As part of the TMS, use best practices and emergency response expertise to prepare and implement a site-specific tailings facility Emergency Preparedness and Response Plan (EPRP) based on credible flow failure scenarios and the assessment of potential consequences. Test and update the EPRP at all phases of the tailings facility lifecycle at a frequency established in the plan, or more frequently if triggered by a material change either to the tailings facility or to the social, environmental and local economic context. Meaningfully engage with employees and contractors to inform the EPRP, and co-develop community-focused emergency preparedness measures with project-affected people.",
  },
  {
    code: "13.2",
    themeNumber: 13,
    description:
      "Trabalhar com órgãos públicos, socorristas, e autoridades e instituições locais e tomar medidas razoáveis no sentido de avaliar a capacidade dos serviços de resposta a emergências de fazer frente aos perigos identificados no PPRE das estruturas de disposição de rejeitos e identificar lacunas na capacidade e uso dessas informações em apoio ao desenvolvimento de um plano colaborativo para melhorar a prontidão.",
    descriptionEn:
      "Engage with public sector agencies, first responders, local authorities and institutions and take reasonable steps to assess the capability of emergency response services to address the hazards identified in the tailings facility EPRP, identify gaps in capability and use this information to support the development of a collaborative plan to improve preparedness.",
  },
  {
    code: "13.3",
    themeNumber: 13,
    description:
      "Considerando medidas focadas na comunidade e a capacidade do setor público, o Operador deve adotar todas as medidas razoáveis para manter um estado compartilhado de prontidão diante de cenários de falha plausíveis de fluxo nas estruturas de disposição de rejeitos, garantindo os recursos necessários para esse fim e oferecendo cursos de treinamentos e realizando exercícios anualmente. O Operador deve realizar exercícios simulados de resposta a emergências na frequência prevista no PPRE, mas pelo menos a intervalos de três anos para estruturas de disposição de rejeitos que ofereçam riscos que possam acarretar perda de vidas.",
    descriptionEn:
      "Considering community-focused measures and public sector capacity, the Operator shall take all reasonable steps to maintain a shared state of readiness for tailings facility credible flow failure scenarios by securing resources and carrying out annual training and exercises. The Operator shall conduct emergency response simulations at a frequency established in the EPRP but at least every 3 years for tailings facilities with potential loss of life.",
  },
  {
    code: "13.4",
    themeNumber: 13,
    description:
      "No caso de uma falha catastrófica nas estruturas de disposição de rejeitos, acionar resposta imediata para salvar vidas, prestar ajuda humanitária e minimizar danos ambientais.",
    descriptionEn:
      "In the case of a catastrophic tailings facility failure, provide immediate response to save lives, supply humanitarian aid and minimise environmental harm.",
  },

  // Princípio 14 — Recuperação de longo prazo
  {
    code: "14.1",
    themeNumber: 14,
    description:
      "Com base em cenários de possíveis manchas de inundação devido a rupturas de estruturas de disposição de rejeitos e na avaliação de suas possíveis consequências, tomar medidas razoáveis para engajar significativamente órgãos públicos e outras organizações que participariam de estratégias sociais e ambientais de médio e longo prazo de resposta a falhas.",
    descriptionEn:
      "Based on tailings facility credible flow failure scenarios and the assessment of potential consequences, take reasonable steps to meaningfully engage with public sector agencies and other organisations that would participate in medium- and long-term social and environmental post-failure response strategies.",
  },
  {
    code: "14.2",
    themeNumber: 14,
    description:
      "Na eventualidade de uma falha catastrófica nas estruturas de disposição de rejeitos, avaliar seus impactos sociais, ambientais e econômicos locais na maior brevidade possível após as pessoas estarem em uma situação segura e suas necessidades de sobrevivência no curto prazo terem sido atendidas.",
    descriptionEn:
      "In the event of a catastrophic tailings facility failure, assess social, environmental and local economic impacts as soon as possible after people are safe and short-term survival needs have been met.",
  },
  {
    code: "14.3",
    themeNumber: 14,
    description:
      "Na eventualidade de uma falha catastrófica nas estruturas de disposição de rejeitos, trabalhar com órgãos públicos e outras partes interessadas no desenvolvimento e implementação de planos de reconstrução, reabilitação e recuperação que abordem os impactos sociais, ambientais e econômicos locais causados pela falha catastrófica no médio e no longo prazo. Esses planos devem, se permitido, ser divulgados por autoridades públicas.",
    descriptionEn:
      "In the event of a catastrophic tailings facility failure, work with public sector agencies and other stakeholders to develop and implement reconstruction, restoration and recovery plans that address the medium- and long-term social, environmental and local economic impacts of the failure. The plans shall be disclosed if permitted by public authorities.",
  },
  {
    code: "14.4",
    themeNumber: 14,
    description:
      "Na eventualidade de uma falha catastrófica nas estruturas de disposição de rejeitos, possibilitar a participação das pessoas afetadas nas obras de reconstrução, reabilitação e recuperação e nas atividades de monitoramento em andamento.",
    descriptionEn:
      "In the event of a catastrophic tailings facility failure, enable the participation of affected people in reconstruction, restoration and recovery works and ongoing monitoring activities.",
  },
  {
    code: "14.5",
    themeNumber: 14,
    description:
      "Facilitar o monitoramento e a divulgação pública de resultados pós-falha compatíveis com os limiares e indicadores descritos nos planos de reconstrução, restauração e recuperação e adaptar essas atividades de acordo com os resultados e com o retorno (feedback) recebido das diversas partes envolvidas.",
    descriptionEn:
      "Facilitate the monitoring and public reporting of post-failure outcomes that are aligned with the thresholds and indicators outlined in the reconstruction, restoration and recovery plans and adapt activities in response to findings and feedback.",
  },

  // Princípio 15 — Divulgação pública e acesso à informação
  {
    code: "15.1",
    themeNumber: 15,
    description:
      "Publicar e atualizar regularmente informações sobre o compromisso do Operador com a gestão segura de estruturas de disposição de rejeitos, a implementação da sua estrutura de governança de rejeitos, suas políticas, normas ou abordagens aplicáveis à organização como um todo para o projeto, construção, monitoramento e fechamento de estruturas de disposição de rejeitos. A. Para novas estruturas de disposição de rejeitos para as quais o processo regulatório de licenciamento tenha sido iniciado ou que de outra maneira tenham sido aprovadas pelo Operador, o Operador publicará e atualizará, em conformidade com o Princípio 21 dos UNGP, as seguintes informações: 1. Um resumo em linguagem simples das justificativas para os pressupostos do projeto e o local selecionado para a sua implementação de acordo com a análise multicritério de alternativas, avaliações de impacto e planos de mitigação (essas informações podem ser obtidas a partir do cumprimento de diversos Requisitos, incluindo, sem limitação, os Requisitos 3.2, 3.3, 5.1, 5.3, 6.4, 6.6, 7.1 e 10.1); e 2. A Classificação de Consequências (Requisito 4.1). B. Para cada estrutura de disposição de rejeitos existente e de acordo com o Princípio 21 dos UNGP, o Operador publicará e atualizará as seguintes informações, pelo menos anualmente: 1. Uma descrição da estrutura de disposição de rejeitos (Requisitos 5.5 e 6.4); 2. A classificação de consequências (Requisito 4.1); 3. Um resumo dos resultados da avaliação de riscos relevantes para a estrutura de disposição de rejeitos (Requisito 10.1); 4. Um resumo de avaliações de impacto e da exposição e vulnerabilidade de seres humanos a cenários possíveis de manchas de inundação resultantes de rupturas de estruturas de disposição de rejeitos (Requisitos 2.4 e 3.3); 5. Uma descrição do projeto para todas as fases do ciclo de vida das estruturas de disposição de rejeitos, inclusive da sua altura atual e final (Requisito 5.5); 6. Um resumo de resultados relevantes das análises anuais de desempenho e do RPSB, inclusive sobre a implementação de medidas de mitigação para reduzir os riscos a um nível tão baixo quanto razoavelmente possível — TBRP (Requisitos 10.4 e 10.5); 7. Um resumo de resultados relevantes do programa de monitoramento ambiental e social, inclusive sobre a implementação de medidas de mitigação (Requisito 7.5); 8. Uma versão resumida dos PPRE das estruturas de disposição de rejeitos para instalações que apresentem um ou mais modos plausíveis de rupturas que possam ocasionar um evento de falha de fluxo (Requisitos 13.1 e 13.2); 9. Datas das revisões independentes mais recentes e das seguintes (Requisito 10.5); e 10. Confirmação anual de que o Operador possui capacidade financeira adequada para arcar com os custos estimados para o fechamento planejado, antecipado, recuperação e pós-fechamento das estruturas de disposição de rejeitos e de suas estruturas auxiliares (Requisito 10.7). Essas informações deverão ser divulgadas diretamente, a menos que estejam sujeitas a limitações impostas por autoridades regulatórias. C. Fornecer às autoridades e serviços de emergência locais informações suficientes oriundas da análise de formação de brechas de ruptura para permitir um planejamento eficaz para a gestão de desastres (Requisito 2.3).",
    descriptionEn:
      "Publish and regularly update information on the Operator's commitment to safe tailings facility management, implementation of its tailings governance framework, its organisation-wide policies, standards or approaches to the design, construction, monitoring and closure of tailings facilities. A. For new tailings facilities for which the regulatory authorisation process has commenced, or that are otherwise approved by the Operator, the Operator shall publish and update, in accordance with Principle 21 of the UNGP, the following information: 1. A plain language summary of the rationale for the basis of the design and site selected as per the multi-criteria alternatives analysis, impact assessments, and mitigation plans (Requirements 3.2, 3.3, 5.1, 5.3, 6.4, 6.6, 7.1 and 10.1); and 2. The Consequence Classification (Requirement 4.1). B. For each existing tailings facility and in accordance with Principle 21 of the UNGP, the Operator shall publish and update at least on an annual basis, the following information: 1. A description of the tailings facility (Requirements 5.5 and 6.4); 2. The Consequence Classification (Requirement 4.1); 3. A summary of risk assessment findings relevant to the tailings facility (Requirement 10.1); 4. A summary of impact assessments and of human exposure and vulnerability to tailings facility credible flow failure scenarios (Requirements 2.4 and 3.3); 5. A description of the design for all phases of the tailings facility lifecycle including the current and final height (Requirement 5.5); 6. A summary of material findings of annual performance reviews and DSR, including implementation of mitigation measures to reduce risk to ALARP (Requirements 10.4 and 10.5); 7. A summary of material findings of the environmental and social monitoring programme including implementation of mitigation measures (Requirement 7.5); 8. A summary version of the tailings facility EPRP for facilities that have a credible failure mode(s) that could lead to a flow failure event (Requirements 13.1 and 13.2); 9. Dates of most recent and next independent reviews (Requirement 10.5); and 10. Annual confirmation that the Operator has adequate financial capacity to cover estimated costs of planned closure, early closure, reclamation, and post-closure of the tailings facility and its appurtenant structures (Requirement 10.7). Such disclosures shall be made directly, unless subject to limitations imposed by regulatory authorities. C. Provide local authorities and emergency services with sufficient information derived from the breach analysis to enable effective disaster management planning (Requirement 2.3).",
  },
  {
    code: "15.2",
    themeNumber: 15,
    description:
      "Responder sistematicamente e oportunamente às solicitações de partes interessadas e afetadas por informações adicionais relevantes para garantir a segurança pública e a integridade de uma estrutura de disposição de rejeitos. Quando uma solicitação de informações for negada, uma explicação deve ser dada à parte interessada solicitante.",
    descriptionEn:
      "Respond in a systematic and timely manner to requests from interested and affected stakeholders for additional information material to the public safety and integrity of a tailings facility. When the request for information is denied, provide an explanation to the requesting stakeholder.",
  },
  {
    code: "15.3",
    themeNumber: 15,
    description:
      "Assumir o compromisso de cooperar com iniciativas plausíveis de transparência global voltadas para a criação de bancos de dados, inventários ou outros repositórios de informações padronizados, independentes, abrangentes e acessíveis ao público sobre a segurança e integridade das estruturas de disposição de rejeitos.",
    descriptionEn:
      "Commit to cooperate in credible global transparency initiatives to create standardised, independent, industry-wide and publicly accessible databases, inventories or other information repositories about the safety and integrity of tailings facilities.",
  },
];
