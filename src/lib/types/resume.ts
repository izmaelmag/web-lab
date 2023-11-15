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

export type Resume = {
	fullName: string;
	age?: number;
	position?: string;

	email?: string;
	phone?: string;
	country?: string;
	city?: string;

	summary?: string;

	employment: EmploymentSection[];
	languages: LanguageOrSkill[];
	skills: LanguageOrSkill[];
	hobbies: Hobbies;
};
