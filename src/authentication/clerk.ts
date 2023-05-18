import clerk from '@clerk/clerk-sdk-node';

export const getUsers = () => {
	return clerk.users.getUserList();
};
