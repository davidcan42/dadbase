import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with Dr. Anna Machin\'s content...')

  // Sample content items based on Dr. Anna Machin's research
  const contentItems = [
    {
      title: "The Making of a Modern Father: Hormonal Changes",
      contentType: "book_chapter",
      sourceReference: "Dr. Anna Machin - The Life of Dad",
      content: "When men become fathers, they undergo significant hormonal changes that are crucial for bonding with their children. Testosterone levels drop by about 30% during the first year of fatherhood, while cortisol and prolactin levels increase. These changes help fathers become more nurturing and responsive to their children's needs. The drop in testosterone makes fathers less aggressive and more focused on caregiving behaviors. Meanwhile, the increase in prolactin, often called the 'caregiving hormone,' enhances paternal instincts and emotional sensitivity. These biological changes are nature's way of preparing men for the important role of fatherhood.",
      summary: "Explores the hormonal changes that occur in men when they become fathers and how these changes support bonding and caregiving behaviors.",
      targetAge: "newborn",
      themes: ["hormones", "bonding", "neuroscience", "biological-changes"],
      complexity: "intermediate"
    },
    {
      title: "Rough and Tumble Play: Why It Matters",
      contentType: "research_paper",
      sourceReference: "Dr. Anna Machin - Research on Father-Child Play",
      content: "Rough and tumble play is a uniquely paternal contribution to child development. This type of physical play, which involves wrestling, tickling, and physical challenges, serves multiple developmental purposes. It helps children develop physical confidence, spatial awareness, and risk assessment skills. Research shows that children who engage in rough and tumble play with their fathers show better emotional regulation and social competence. This play style also helps children learn boundaries and develop resilience. Fathers naturally engage in this type of play more than mothers, making it a special father-child bonding activity.",
      summary: "Examines the importance of rough and tumble play between fathers and children for emotional and social development.",
      targetAge: "toddler",
      themes: ["play", "physical-development", "emotional-regulation", "bonding"],
      complexity: "beginner"
    },
    {
      title: "The Father's Role in Child Development",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Paternal Impact Studies",
      content: "Fathers play a unique and irreplaceable role in child development that complements but differs from maternal influence. Research demonstrates that fathers tend to be more challenging and less predictable in their interactions, which helps children develop problem-solving skills and adaptability. Fathers are more likely to encourage independence and risk-taking in age-appropriate ways. They also serve as important models for emotional regulation, particularly for sons. The father-child relationship has been linked to better academic performance, reduced behavioral problems, and improved social skills. Even in cases where fathers don't live with their children, maintaining a positive relationship remains crucial for optimal child development.",
      summary: "Discusses the unique contributions fathers make to child development and why the father-child relationship is essential.",
      targetAge: "child",
      themes: ["development", "father-role", "independence", "modeling"],
      complexity: "intermediate"
    },
    {
      title: "Supporting Your Partner Through Postpartum",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Family Support Research",
      content: "The transition to parenthood affects both partners, and fathers play a crucial role in supporting their partner through the postpartum period. Understanding the physical and emotional changes your partner is experiencing can help you provide better support. New mothers may experience mood swings, anxiety, and physical discomfort as they recover from childbirth. Fathers can help by taking on household responsibilities, providing emotional support, and being patient with the adjustment process. It's important to watch for signs of postpartum depression in both partners, as fathers can also experience paternal depression. Open communication and seeking professional help when needed are essential for family wellbeing.",
      summary: "Guidance for fathers on how to support their partner during the postpartum period and navigate the transition to parenthood together.",
      targetAge: "newborn",
      themes: ["partnership", "postpartum", "support", "communication"],
      complexity: "beginner"
    },
    {
      title: "Building Confidence as a New Father",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Paternal Confidence Studies",
      content: "Many new fathers struggle with confidence in their parenting abilities, feeling uncertain about how to care for their children. This is completely normal and expected. Confidence comes through practice and experience, not through innate ability. Start with simple interactions like feeding, diaper changes, and playtime. Don't be discouraged by initial awkwardness - all parents learn through trial and error. Seek support from other fathers, parenting groups, or professionals when needed. Remember that your unique contribution as a father is valuable and cannot be replaced by anyone else. Trust your instincts and be patient with yourself as you learn and grow into your role.",
      summary: "Addresses common concerns about parental confidence and provides practical advice for new fathers.",
      targetAge: "newborn",
      themes: ["confidence", "new-fathers", "support", "learning"],
      complexity: "beginner"
    },
    {
      title: "Work-Life Balance for Modern Fathers",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Modern Fatherhood Research",
      content: "Balancing work responsibilities with fatherhood is one of the biggest challenges modern fathers face. The traditional model of the distant working father is being replaced by expectations of active, involved fatherhood. This shift requires intentional planning and boundary-setting. Prioritize quality time with your children, even if the quantity is limited. Be fully present during the time you have together. Communicate with your employer about family needs and explore flexible work arrangements when possible. Remember that being a good provider includes emotional and physical presence, not just financial support. Model healthy work-life balance for your children and show them that family relationships are a priority.",
      summary: "Strategies for managing work responsibilities while maintaining an active, involved role as a father.",
      targetAge: "child",
      themes: ["work-life-balance", "modern-fathers", "priorities", "involvement"],
      complexity: "intermediate"
    },
    {
      title: "Understanding Teenage Development: A Father's Guide",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Adolescent Development Research",
      content: "The teenage years present unique challenges and opportunities for fathers. Adolescents are developing their identity and seeking independence, which can create tension with parents. Fathers can support their teenagers by maintaining open communication while respecting their growing autonomy. Be available to listen without immediately offering solutions. Understand that mood swings and emotional intensity are normal parts of brain development. Set clear boundaries while allowing age-appropriate freedoms. Your role shifts from protector to guide during these years. Continue to model the values and behaviors you want to see in your teenager. Remember that your relationship with your teen is laying the foundation for your adult relationship.",
      summary: "Insights into teenage development and how fathers can navigate the challenges and opportunities of this stage.",
      targetAge: "teenager",
      themes: ["adolescence", "independence", "communication", "guidance"],
      complexity: "advanced"
    },
    {
      title: "The Science of Father-Child Bonding",
      contentType: "research_paper",
      sourceReference: "Dr. Anna Machin - Bonding Research Studies",
      content: "Father-child bonding is a complex neurobiological process that begins during pregnancy and continues throughout the child's development. Brain imaging studies show that fathers' brains undergo structural changes when they become parents, particularly in areas related to empathy, anxiety, and attachment. The bonding process is supported by hormonal changes including increased oxytocin and decreased testosterone. Skin-to-skin contact, caregiving activities, and playful interactions all contribute to stronger father-child bonds. Unlike maternal bonding, which is often immediate, father-child bonding may develop more gradually through shared experiences and caregiving activities. This bonding process is crucial for child development and paternal well-being.",
      summary: "Examines the neurobiological basis of father-child bonding and the factors that strengthen these relationships.",
      targetAge: "newborn",
      themes: ["bonding", "neuroscience", "oxytocin", "caregiving"],
      complexity: "advanced"
    },
    {
      title: "Managing Parental Stress and Anxiety",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Parental Mental Health Research",
      content: "Parenting can be stressful, and fathers may experience anxiety about their ability to provide for and protect their children. It's important to recognize that some stress is normal and expected. However, chronic stress can impact both your well-being and your ability to be an effective parent. Develop healthy coping strategies such as regular exercise, adequate sleep, and social support. Don't hesitate to seek professional help if stress becomes overwhelming. Practice mindfulness and stress-reduction techniques. Remember that taking care of your own mental health is not selfish - it's essential for being the best father you can be. Your emotional well-being directly impacts your children's development and family dynamics.",
      summary: "Addresses the common experience of parental stress and anxiety, offering practical strategies for management.",
      targetAge: "child",
      themes: ["stress", "anxiety", "mental-health", "self-care"],
      complexity: "intermediate"
    },
    {
      title: "Creating Lasting Family Traditions",
      contentType: "article",
      sourceReference: "Dr. Anna Machin - Family Bonding Studies",
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