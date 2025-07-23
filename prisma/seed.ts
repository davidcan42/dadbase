import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with leading fatherhood research content...')

  // Sample content items based on leading research in fatherhood
  const contentItems = [
    {
      title: "The Making of a Modern Father: Hormonal Changes",
      contentType: "book_chapter",
      sourceReference: "Leading Research - Paternal Neuroscience",
      content: "When men become fathers, they undergo significant hormonal changes that are crucial for bonding with their children. Testosterone levels drop by about 30% during the first year of fatherhood, while cortisol and prolactin levels increase. These changes help fathers become more nurturing and responsive to their children's needs. The drop in testosterone makes fathers less aggressive and more focused on caregiving behaviors. Meanwhile, the increase in prolactin, often called the 'caregiving hormone,' enhances paternal instincts and emotional sensitivity. These biological changes are nature's way of preparing men for the important role of fatherhood.",
      summary: "Explores the hormonal changes that occur in men when they become fathers and how these changes support bonding and caregiving behaviors.",
      targetAge: "newborn",
      themes: ["hormones", "bonding", "neuroscience", "biological-changes"],
      complexity: "intermediate"
    },
    {
      title: "Rough and Tumble Play: Why It Matters",
      contentType: "research_paper",
      sourceReference: "International Research - Father-Child Play Studies",
      content: "Rough and tumble play is a uniquely paternal contribution to child development. This type of physical play, which involves wrestling, tickling, and physical challenges, serves multiple developmental purposes. It helps children develop physical confidence, spatial awareness, and risk assessment skills. Research shows that children who engage in rough and tumble play with their fathers show better emotional regulation and social competence. This play style also helps children learn boundaries and develop resilience. Fathers naturally engage in this type of play more than mothers, making it a special father-child bonding activity.",
      summary: "Examines the importance of rough and tumble play between fathers and children for emotional and social development.",
      targetAge: "toddler",
      themes: ["play", "physical-development", "emotional-regulation", "bonding"],
      complexity: "beginner"
    },
    {
      title: "Understanding Your Child's Development Through a Father's Lens",
      contentType: "article",
      sourceReference: "Global Fatherhood Research Institute",
      content: "Fathers bring a unique perspective to understanding child development that complements but differs from the maternal viewpoint. Research shows that fathers tend to challenge their children in different ways, encouraging independence and risk-taking within safe boundaries. This paternal approach helps children develop confidence, problem-solving skills, and resilience. Fathers often excel at reading non-verbal cues and responding to their children's emotional needs in ways that promote emotional intelligence. Understanding these natural paternal instincts can help fathers embrace their unique role in their child's development and feel more confident in their parenting abilities.",
      summary: "Explores how fathers uniquely contribute to child development and the importance of embracing paternal instincts.",
      targetAge: "child",
      themes: ["development", "paternal-role", "confidence", "uniqueness"],
      complexity: "intermediate"
    },
    {
      title: "Building Strong Family Bonds: The Father Factor",
      contentType: "research_paper",
      sourceReference: "International Journal of Fatherhood Studies",
      content: "Strong family relationships are built through consistent, intentional interactions between fathers and their children. Research demonstrates that children with actively involved fathers show better academic performance, social skills, and emotional regulation. The key is not the quantity of time spent together, but the quality of interactions. Fathers who are emotionally available, responsive to their children's needs, and actively engaged in their lives create lasting positive impacts. Simple activities like shared meals, bedtime routines, and one-on-one conversations can significantly strengthen the father-child bond and contribute to overall family cohesion.",
      summary: "Examines how fathers can build strong relationships with their children through quality interactions and emotional availability.",
      targetAge: "child",
      themes: ["bonding", "family-relationships", "quality-time", "involvement"],
      complexity: "beginner"
    },
    {
      title: "Building Confidence as a New Father",
      contentType: "article",
      sourceReference: "Leading Parental Confidence Studies",
      content: "Many new fathers struggle with confidence in their parenting abilities, feeling uncertain about how to care for their children. This is completely normal and expected. Confidence comes through practice and experience, not through innate ability. Start with simple interactions like feeding, diaper changes, and playtime. Don't be discouraged by initial awkwardness - all parents learn through trial and error. Seek support from other fathers, parenting groups, or professionals when needed. Remember that your unique contribution as a father is valuable and cannot be replaced by anyone else. Trust your instincts and be patient with yourself as you learn and grow into your role.",
      summary: "Addresses common concerns about parental confidence and provides practical advice for new fathers.",
      targetAge: "newborn",
      themes: ["confidence", "new-fathers", "support", "learning"],
      complexity: "beginner"
    },
    {
      title: "Work-Life Balance for Modern Fathers",
      contentType: "article",
      sourceReference: "Modern Fatherhood Research Consortium",
      content: "Balancing work responsibilities with fatherhood is one of the biggest challenges modern fathers face. The traditional model of the distant working father is being replaced by expectations of active, involved fatherhood. This shift requires intentional planning and boundary-setting. Prioritize quality time with your children, even if the quantity is limited. Be fully present during the time you have together. Communicate with your employer about family needs and explore flexible work arrangements when possible. Remember that being a good provider includes emotional and physical presence, not just financial support. Model healthy work-life balance for your children and show them that family relationships are a priority.",
      summary: "Strategies for managing work responsibilities while maintaining an active, involved role as a father.",
      targetAge: "child",
      themes: ["work-life-balance", "modern-fathers", "priorities", "involvement"],
      complexity: "intermediate"
    },
    {
      title: "Navigating Fatherhood During Your Child's Teenage Years",
      contentType: "book_chapter",
      sourceReference: "Adolescent Development Research Institute",
      content: "Fatherhood during the teenage years requires a shift in approach from the early parenting years. Teenagers need fathers who can provide guidance while respecting their growing independence. This is a time when many fathers feel less relevant, but research shows that father involvement during adolescence is crucial for healthy development. Focus on being available without being intrusive, offering advice when asked, and maintaining consistent boundaries while allowing for increased freedom. Your role as a father doesn't diminish during these years - it evolves to meet your teenager's changing needs.",
      summary: "Guidance for fathers on maintaining strong relationships with their children during the challenging teenage years.",
      targetAge: "teenager",
      themes: ["teenagers", "independence", "guidance", "boundaries"],
      complexity: "advanced"
    },
    {
      title: "The Science of Father-Child Bonding",
      contentType: "research_paper",
      sourceReference: "International Bonding Research Studies",
      content: "Father-child bonding is a complex neurobiological process that begins during pregnancy and continues throughout the child's development. Brain imaging studies show that fathers' brains undergo structural changes when they become parents, particularly in areas related to empathy, anxiety, and attachment. The bonding process is supported by hormonal changes including increased oxytocin and decreased testosterone. Skin-to-skin contact, caregiving activities, and playful interactions all contribute to stronger father-child bonds. Unlike maternal bonding, which is often immediate, father-child bonding may develop more gradually through shared experiences and caregiving activities. This bonding process is crucial for child development and paternal well-being.",
      summary: "Examines the neurobiological basis of father-child bonding and the factors that strengthen these relationships.",
      targetAge: "newborn",
      themes: ["bonding", "neuroscience", "oxytocin", "caregiving"],
      complexity: "advanced"
    },
    {
      title: "Managing Parental Stress and Anxiety",
      contentType: "article",
      sourceReference: "Parental Mental Health Research Coalition",
      content: "Parenting can be stressful, and fathers may experience anxiety about their ability to provide for and protect their children. It's important to recognize that some stress is normal and expected. However, chronic stress can impact both your well-being and your ability to be an effective parent. Develop healthy coping strategies such as regular exercise, adequate sleep, and social support. Don't hesitate to seek professional help if stress becomes overwhelming. Practice mindfulness and stress-reduction techniques. Remember that taking care of your own mental health is not selfish - it's essential for being the best father you can be. Your emotional well-being directly impacts your children's development and family dynamics.",
      summary: "Addresses the common experience of parental stress and anxiety, offering practical strategies for management.",
      targetAge: "child",
      themes: ["stress", "anxiety", "mental-health", "self-care"],
      complexity: "intermediate"
    },
    {
      title: "Creating Lasting Family Traditions",
      contentType: "article",
      sourceReference: "Family Bonding Research Institute",
      content: "Family traditions play a crucial role in creating lasting bonds and positive memories. These don't need to be elaborate or expensive - simple, consistent activities can be the most meaningful. Consider weekly father-child activities like cooking together, reading bedtime stories, or going for walks. Holiday traditions, birthday celebrations, and seasonal activities help create a sense of family identity and belonging. The key is consistency and intentionality. Let your children help create and maintain these traditions as they grow older. These shared experiences become the foundation of family relationships and create positive associations with family time. Remember that the goal is connection, not perfection.",
      summary: "Explores the importance of family traditions in building strong father-child relationships and creating lasting memories.",
      targetAge: "child",
      themes: ["traditions", "bonding", "family-time", "memories"],
      complexity: "beginner"
    }
  ]

  // Insert content items
  for (const item of contentItems) {
    await prisma.contentItem.create({
      data: item
    })
  }

  console.log(`Successfully seeded ${contentItems.length} content items`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 