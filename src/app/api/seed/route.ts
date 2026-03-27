import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Wipe and reseed
    await prisma.cuppingSessionLot.deleteMany()
    await prisma.cuppingSession.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.evaluation.deleteMany()
    await prisma.recipe.deleteMany()
    await prisma.lot.deleteMany()
    await prisma.user.deleteMany()

    // --- Users (реальная команда) ---
    const users = [
      { username: 'vladimir', password: 'Vlad2026!cup', name: 'Владимир', role: 'SUPER_ADMIN' as const },
      { username: 'boyko.ivan', password: 'Boyko!barista7', name: 'Бойко Иван', role: 'ADMIN' as const },
      { username: 'chernov', password: 'Chernov#cafe3', name: 'Чернов Алексей', role: 'MEMBER' as const },
      { username: 'naumenko', password: 'Nastya!cup24', name: 'Науменко Анастасия', role: 'ADMIN' as const },
      { username: 'eremeev', password: 'Fedor@brew5', name: 'Еремеев Фёдор', role: 'MEMBER' as const },
      { username: 'agafonova', password: 'Liza!aroma9', name: 'Агафонова Елизавета', role: 'MEMBER' as const },
      { username: 'golub', password: 'Valya#cup2026', name: 'Голубятникова Валентина', role: 'MEMBER' as const },
      { username: 'koverko', password: 'Liza!coffee8', name: 'Коверко Елизавета', role: 'MEMBER' as const },
      { username: 'kondrashev', password: 'Anton@brew77', name: 'Кондрашев Антон', role: 'MEMBER' as const },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdUsers: Record<string, any> = {}
    for (const u of users) {
      const hash = await hashPassword(u.password)
      createdUsers[u.username] = await prisma.user.create({
        data: { username: u.username, passwordHash: hash, name: u.name, role: u.role },
      })
    }

    const admin = createdUsers['vladimir']
    const anna = createdUsers['naumenko']
    const ivan = createdUsers['boyko.ivan']
    const masha = createdUsers['chernov']

    // --- Lot 1: Эфиопия Сидамо — 3 оценки, 3 рецепта, комментарии ---
    const lot1 = await prisma.lot.create({
      data: {
        name: 'Эфиопия Сидамо',
        country: 'Эфиопия, Сидамо',
        roaster: 'Camera Obscura',
        farm: 'Станция Бенса',
        variety: 'Хейрлум',
        processing: 'NATURAL',
        roastLevel: 'LIGHT',
        roastDate: new Date('2026-03-10'),
        descriptors: 'Черника, жасмин, бергамот, мёд',
        photoUrl: '/lots/ethiopia-sidamo.svg',
        status: 'ACTIVE',
      },
    })

    await prisma.recipe.create({ data: { lotId: lot1.id, brewMethod: 'V60', recipeType: 'OFFICIAL', authorId: admin.id, dose: 15, yield: 250, ratio: '1:16.7', grind: '24 клика на Comandante', temperature: 93, brewTime: '3:00', notes: 'Блум 30 сек, 3 вливания по 80 мл' } })
    await prisma.recipe.create({ data: { lotId: lot1.id, brewMethod: 'ESPRESSO', recipeType: 'OFFICIAL', authorId: admin.id, dose: 18, yield: 40, ratio: '1:2.2', grind: '8 на Eureka Mignon', temperature: 93, brewTime: '0:28', notes: 'Предсмачивание 3 сек' } })
    await prisma.recipe.create({ data: { lotId: lot1.id, brewMethod: 'AEROPRESS', recipeType: 'UNOFFICIAL', authorId: anna.id, dose: 14, yield: 200, ratio: '1:14.3', grind: '20 клика на Comandante', temperature: 88, brewTime: '2:00', notes: 'Инвертированный метод, 1:30 настаивание' } })

    await prisma.evaluation.create({ data: { userId: admin.id, lotId: lot1.id, aroma: 8.25, flavor: 8.5, aftertaste: 8.0, acidity: 8.75, body: 7.75, sweetness: 8.5, cleanCup: 8.25, overall: 8.5, totalScore: 8.31, descriptors: 'Яркая черника, цветочные ноты', comment: 'Отличный лот, очень чистый вкус' } })
    await prisma.evaluation.create({ data: { userId: anna.id, lotId: lot1.id, aroma: 8.0, flavor: 8.25, aftertaste: 7.75, acidity: 9.0, body: 7.5, sweetness: 8.25, cleanCup: 8.0, overall: 8.25, totalScore: 8.13, descriptors: 'Ягоды, цветы, чай', comment: 'Кислотность яркая, но приятная' } })
    await prisma.evaluation.create({ data: { userId: ivan.id, lotId: lot1.id, aroma: 8.5, flavor: 8.0, aftertaste: 8.25, acidity: 8.25, body: 8.0, sweetness: 8.75, cleanCup: 8.5, overall: 8.0, totalScore: 8.28, descriptors: 'Черника, мёд, жасмин' } })

    await prisma.comment.create({ data: { lotId: lot1.id, userId: anna.id, text: 'Очень хорошо раскрывается на V60, рекомендую попробовать с температурой 92°C' } })
    await prisma.comment.create({ data: { lotId: lot1.id, userId: ivan.id, text: 'На аэропрессе тоже отлично, но нужен более мелкий помол' } })

    // --- Lot 2: Колумбия Уила — 4 оценки, 2 рецепта ---
    const lot2 = await prisma.lot.create({
      data: {
        name: 'Колумбия Уила',
        country: 'Колумбия, Уила',
        roaster: 'Rockets Coffee',
        farm: 'Finca El Paraiso',
        variety: 'Кастильо',
        processing: 'WASHED',
        roastLevel: 'MEDIUM',
        roastDate: new Date('2026-03-15'),
        descriptors: 'Карамель, апельсин, молочный шоколад',
        photoUrl: '/lots/colombia-huila.svg',
        status: 'ACTIVE',
      },
    })

    await prisma.recipe.create({ data: { lotId: lot2.id, brewMethod: 'V60', recipeType: 'OFFICIAL', authorId: admin.id, dose: 15, yield: 225, ratio: '1:15', grind: '22 клика на Comandante', temperature: 94, brewTime: '2:45', notes: 'Метод 4:6 Тетсу Катсуя' } })
    await prisma.recipe.create({ data: { lotId: lot2.id, brewMethod: 'ESPRESSO', recipeType: 'OFFICIAL', authorId: admin.id, dose: 18.5, yield: 42, ratio: '1:2.3', grind: '7.5 на Eureka Mignon', temperature: 93.5, brewTime: '0:30', notes: 'Классический эспрессо, хорошо в молоке' } })

    await prisma.evaluation.create({ data: { userId: admin.id, lotId: lot2.id, aroma: 7.75, flavor: 8.0, aftertaste: 7.5, acidity: 7.25, body: 8.25, sweetness: 8.0, cleanCup: 7.75, overall: 7.75, totalScore: 7.78, descriptors: 'Шоколад, орехи, мягкая кислотность', comment: 'Хороший базовый лот для молочных напитков' } })
    await prisma.evaluation.create({ data: { userId: anna.id, lotId: lot2.id, aroma: 7.5, flavor: 7.75, aftertaste: 7.25, acidity: 7.0, body: 8.5, sweetness: 8.25, cleanCup: 8.0, overall: 7.5, totalScore: 7.72, descriptors: 'Карамель, орех, апельсиновая цедра' } })
    await prisma.evaluation.create({ data: { userId: ivan.id, lotId: lot2.id, aroma: 8.0, flavor: 8.25, aftertaste: 7.75, acidity: 7.5, body: 8.0, sweetness: 7.75, cleanCup: 7.5, overall: 8.0, totalScore: 7.84, descriptors: 'Молочный шоколад, ирис' } })
    await prisma.evaluation.create({ data: { userId: masha.id, lotId: lot2.id, aroma: 7.25, flavor: 7.5, aftertaste: 7.0, acidity: 7.75, body: 8.0, sweetness: 8.5, cleanCup: 8.25, overall: 7.75, totalScore: 7.75, descriptors: 'Сладкий, шоколадный', comment: 'Мой фаворит для капучино' } })

    await prisma.comment.create({ data: { lotId: lot2.id, userId: masha.id, text: 'Идеальный лот для флэт уайта!' } })

    // --- Lot 3: Кения Ньери — 2 оценки, 1 рецепт ---
    const lot3 = await prisma.lot.create({
      data: {
        name: 'Кения Ньери АА',
        country: 'Кения, Ньери',
        roaster: '咖啡 Roasters',
        farm: 'Kagumoini Factory',
        variety: 'SL-28, SL-34',
        processing: 'WASHED',
        roastLevel: 'LIGHT',
        roastDate: new Date('2026-03-18'),
        descriptors: 'Чёрная смородина, томат, грейпфрут, коричневый сахар',
        photoUrl: '/lots/kenya-nyeri.svg',
        status: 'ACTIVE',
      },
    })

    await prisma.recipe.create({ data: { lotId: lot3.id, brewMethod: 'V60', recipeType: 'OFFICIAL', authorId: admin.id, dose: 15, yield: 240, ratio: '1:16', grind: '25 клика на Comandante', temperature: 92, brewTime: '3:15', notes: 'Медленный пролив, дать остыть до 60°C — раскрывается сладость' } })

    await prisma.evaluation.create({ data: { userId: admin.id, lotId: lot3.id, aroma: 8.75, flavor: 9.0, aftertaste: 8.5, acidity: 9.25, body: 7.5, sweetness: 8.25, cleanCup: 8.75, overall: 9.0, totalScore: 8.63, descriptors: 'Смородина, грейпфрут, сочная кислотность', comment: 'Выдающийся лот. Лучшая Кения за последний год' } })
    await prisma.evaluation.create({ data: { userId: ivan.id, lotId: lot3.id, aroma: 8.5, flavor: 8.75, aftertaste: 8.25, acidity: 9.5, body: 7.25, sweetness: 8.0, cleanCup: 8.5, overall: 8.75, totalScore: 8.44, descriptors: 'Томат, смородина, яркая!', comment: 'Кислотность может быть слишком для некоторых гостей' } })

    // --- Lot 4: Бразилия Серрадо — только что добавлен, ещё нет оценок, 1 рецепт ---
    const lot4 = await prisma.lot.create({
      data: {
        name: 'Бразилия Серрадо',
        country: 'Бразилия, Серрадо Минейро',
        roaster: 'Surf Coffee',
        farm: 'Fazenda Santa Lúcia',
        variety: 'Жёлтый Бурбон',
        processing: 'NATURAL',
        roastLevel: 'MEDIUM',
        roastDate: new Date('2026-03-20'),
        descriptors: 'Арахис, какао, сухофрукты, низкая кислотность',
        photoUrl: '/lots/brazil-cerrado.svg',
        status: 'ACTIVE',
      },
    })

    await prisma.recipe.create({ data: { lotId: lot4.id, brewMethod: 'ESPRESSO', recipeType: 'OFFICIAL', authorId: admin.id, dose: 19, yield: 38, ratio: '1:2', grind: '7 на Eureka Mignon', temperature: 94, brewTime: '0:26', notes: 'Плотный, насыщенный. Отлично для эспрессо и молочных' } })

    // --- Lot 5: Гватемала Антигуа — 3 оценки, 4 рецепта, активные обсуждения ---
    const lot5 = await prisma.lot.create({
      data: {
        name: 'Гватемала Антигуа',
        country: 'Гватемала, Антигуа',
        roaster: 'Tasty Coffee',
        farm: 'Finca La Hermosa',
        variety: 'Бурбон',
        processing: 'HONEY',
        roastLevel: 'MEDIUM',
        roastDate: new Date('2026-03-08'),
        descriptors: 'Мёд, зелёное яблоко, миндаль, молочный шоколад',
        photoUrl: '/lots/guatemala-antigua.svg',
        status: 'ACTIVE',
      },
    })

    await prisma.recipe.create({ data: { lotId: lot5.id, brewMethod: 'V60', recipeType: 'OFFICIAL', authorId: admin.id, dose: 15, yield: 230, ratio: '1:15.3', grind: '23 клика на Comandante', temperature: 93, brewTime: '2:50', notes: 'Стандартный пролив, не передержать — появится горечь' } })
    await prisma.recipe.create({ data: { lotId: lot5.id, brewMethod: 'ESPRESSO', recipeType: 'OFFICIAL', authorId: admin.id, dose: 18, yield: 36, ratio: '1:2', grind: '8 на Eureka Mignon', temperature: 93, brewTime: '0:27' } })
    await prisma.recipe.create({ data: { lotId: lot5.id, brewMethod: 'AEROPRESS', recipeType: 'UNOFFICIAL', authorId: ivan.id, dose: 16, yield: 220, ratio: '1:13.7', grind: '18 клика на Comandante', temperature: 85, brewTime: '1:30', notes: 'Холодный аэропресс: залить, перемешать, 1:30, отжать. Подавать со льдом' } })
    await prisma.recipe.create({ data: { lotId: lot5.id, brewMethod: 'V60', recipeType: 'UNOFFICIAL', authorId: masha.id, dose: 20, yield: 320, ratio: '1:16', grind: '26 клика на Comandante', temperature: 92, brewTime: '3:40', notes: 'Большая порция на двоих. Блум 40 сек, 4 вливания' } })

    await prisma.evaluation.create({ data: { userId: admin.id, lotId: lot5.id, aroma: 7.75, flavor: 8.0, aftertaste: 7.75, acidity: 7.5, body: 8.25, sweetness: 8.5, cleanCup: 8.0, overall: 8.0, totalScore: 7.97, descriptors: 'Мёд, яблоко, сбалансированный', comment: 'Стабильный лот, подходит для всех методов' } })
    await prisma.evaluation.create({ data: { userId: anna.id, lotId: lot5.id, aroma: 8.0, flavor: 7.75, aftertaste: 7.5, acidity: 7.75, body: 8.5, sweetness: 8.75, cleanCup: 8.25, overall: 8.25, totalScore: 8.09, descriptors: 'Миндаль, мёд, яблочный пирог', comment: 'Очень сладкий, гости хвалят' } })
    await prisma.evaluation.create({ data: { userId: masha.id, lotId: lot5.id, aroma: 7.5, flavor: 7.5, aftertaste: 7.25, acidity: 7.25, body: 8.0, sweetness: 8.25, cleanCup: 7.75, overall: 7.75, totalScore: 7.66, descriptors: 'Орех, шоколад, немного плоско', comment: 'Нормально, но не вау' } })

    await prisma.comment.create({ data: { lotId: lot5.id, userId: anna.id, text: 'Этот лот отлично заходит гостям, которые не любят кислотность' } })
    await prisma.comment.create({ data: { lotId: lot5.id, userId: ivan.id, text: 'Попробуйте холодный аэропресс — совсем другой кофе, очень свежий' } })
    await prisma.comment.create({ data: { lotId: lot5.id, userId: admin.id, text: 'Записал как основной лот для фильтра на следующую неделю' } })

    // --- Lot 6: Руанда Ньямашеке — 1 оценка, нет рецептов ---
    const lot6 = await prisma.lot.create({
      data: {
        name: 'Руанда Ньямашеке',
        country: 'Руанда, Ньямашеке',
        roaster: 'Camera Obscura',
        variety: 'Красный Бурбон',
        processing: 'ANAEROBIC',
        roastLevel: 'LIGHT',
        roastDate: new Date('2026-03-19'),
        descriptors: 'Маракуйя, личи, ром, тропические фрукты',
        photoUrl: '/lots/rwanda-nyamasheke.svg',
        status: 'ACTIVE',
      },
    })

    await prisma.evaluation.create({ data: { userId: admin.id, lotId: lot6.id, aroma: 9.0, flavor: 8.75, aftertaste: 8.5, acidity: 8.0, body: 7.75, sweetness: 9.0, cleanCup: 8.25, overall: 8.75, totalScore: 8.5, descriptors: 'Маракуйя, личи, невероятная сладость', comment: 'Экспериментальный лот, анаэробная обработка. Нужно попробовать всей команде' } })

    // --- Lot 7: Архивный лот ---
    await prisma.lot.create({
      data: {
        name: 'Коста-Рика Тарразу',
        country: 'Коста-Рика, Тарразу',
        roaster: 'Surf Coffee',
        farm: 'Hacienda La Minita',
        variety: 'Катурра',
        processing: 'WASHED',
        roastLevel: 'LIGHT',
        descriptors: 'Лайм, зелёное яблоко, тростниковый сахар',
        photoUrl: '/lots/costa-rica-tarrazu.svg',
        status: 'ARCHIVED',
      },
    })

    // --- Cupping Sessions ---
    await prisma.cuppingSession.create({
      data: {
        name: 'Каппинг новых лотов — март',
        date: new Date('2026-03-25'),
        notes: 'Тестируем 3 новых лота перед вводом в меню',
        createdById: admin.id,
        lots: {
          create: [
            { lotId: lot4.id, order: 0 },
            { lotId: lot6.id, order: 1 },
            { lotId: lot3.id, order: 2 },
          ],
        },
      },
    })

    await prisma.cuppingSession.create({
      data: {
        name: 'Еженедельный каппинг #12',
        date: new Date('2026-03-18'),
        notes: 'Калибровка вкуса по текущим лотам',
        createdById: admin.id,
        lots: {
          create: [
            { lotId: lot1.id, order: 0 },
            { lotId: lot2.id, order: 1 },
            { lotId: lot5.id, order: 2 },
          ],
        },
      },
    })

    await prisma.cuppingSession.create({
      data: {
        name: 'Каппинг Эфиопия vs Кения',
        date: new Date('2026-03-10'),
        notes: 'Сравнение африканских лотов — светлая обжарка',
        createdById: admin.id,
        lots: {
          create: [
            { lotId: lot1.id, order: 0 },
            { lotId: lot3.id, order: 1 },
          ],
        },
      },
    })

    return NextResponse.json({
      message: 'База заполнена! 7 лотов, 9 сотрудников, 3 каппинга.',
      accounts: users.map((u) => ({ username: u.username, password: u.password, name: u.name, role: u.role === 'ADMIN' ? 'Шеф-бариста' : 'Бариста' })),
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Ошибка заполнения базы', details: String(error) }, { status: 500 })
  }
}
