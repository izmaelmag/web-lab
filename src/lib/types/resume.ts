// Employment section =============
export type EmploymentSection = {
	title: string;
	cards: EmploymentCard[];
};

export type EmploymentCard = {
	title: string;
	location: string;
	startDate: string;
	endDate: string;
	description?: string;
};
// =================================
// =================================
// Courses section =================
export type CourseSection = {
	title: string;
	cards: CourseCard[];
};

export type CourseCard = {
	university: string;
	course: string;
};
// =================================
// =================================
// Education section ===============
export type EducationSection = {
	title: string;
	cards: EducationCard[];
};

export type EducationCard = {
	university: string;
	degree: string;
	location: string;
	date: string;
};
// =================================
// =================================
// Secondary sections ==============
export type LanguageOrSkill = {
	name: string;
	level: string;
};

export type Link = {
	name: string;
	url: string;
};

export type Hobbies = string[];
// =================================
// =================================
// Resume document =================
export type ResumeData = {
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

	position?: string;

	summary?: string;

	languages: LanguageOrSkill[];

	skills: LanguageOrSkill[];

	hobbies: Hobbies;

	employment: EmploymentSection[];
};
// =================================
