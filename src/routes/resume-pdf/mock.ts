import type { Resume } from '$lib/types/resume';

export const DemoResume: Resume = {
	fullName: 'John Doe',
	age: 30,
	position: 'Frontend developer',
	email: 'johndoe@example.com',
	phone: '+1 (555) 123-4567',
	country: 'United States',
	city: 'New York',
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
