export type EmploymentCard = {
	title: string;
	location: string;
	startDate: string;
	endDate: string;
	description?: string;
};

export type EmploymentSection = {
	title: string;
	cards: EmploymentCard[];
};

export type CourseCard = {
	university: string;
	course: string;
};

export type CourseSection = {
	title: string;
	cards: CourseCard[];
};

export type EducationCard = {
	university: string;
	degree: string;
	location: string;
	date: string;
};

export type EducationSection = {
	title: string;
	cards: EducationCard[];
};

export type LanguageOrSkill = {
	name: string;
	level: string;
};

export type Link = {
	name: string;
	url: string;
};

export type Hobbies = string[];

export type UserData = {
	personal: {
		fullName: string;
		age?: number;
	};

	contacts: {
		email?: string;
		phone?: string;
		country?: string;
		city?: string;
	};

	summary?: string;

	languages: LanguageOrSkill[];

	skills: LanguageOrSkill[];

	hobbies: Hobbies;

	employment: EmploymentSection[];
};

export const DemoResume: UserData = {
	personal: {
		fullName: 'John Doe',
		age: 30
	},
	contacts: {
		email: 'johndoe@example.com',
		phone: '+1 (555) 123-4567',
		country: 'United States',
		city: 'New York'
	},
	summary:
		'Experienced and passionate Frontend Developer with a strong background in modern web technologies.',
	languages: [
		{ name: 'English', level: 'Native' },
		{ name: 'Spanish', level: 'Intermediate' }
	],
	skills: [
		{ name: 'JavaScript', level: 'Expert' },
		{ name: 'React', level: 'Expert' },
		{ name: 'CSS', level: 'Advanced' }
	],
	hobbies: ['Coding', 'Hiking', 'Photography'],
	employment: [
		{
			title: 'Employment History',
			cards: [
				{
					title: 'Senior Frontend Developer',
					location: 'XYZ Corp, New York, NY',
					startDate: '2018-01-01',
					endDate: 'Present',
					description:
						'Lead a team of developers in creating innovative web applications using React and Redux.'
				},
				{
					title: 'Frontend Developer',
					location: 'ABC Inc, Boston, MA',
					startDate: '2015-06-01',
					endDate: '2017-12-31',
					description:
						'Developed and maintained high-quality, responsive web interfaces using Angular and TypeScript.'
				}
			]
		}
	]
};
