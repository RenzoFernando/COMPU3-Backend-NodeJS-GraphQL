import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

type GraphQLRequest = {
  user?: User;
};

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext): User | User[keyof User] | undefined => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext<{ req: GraphQLRequest }>().req;
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
