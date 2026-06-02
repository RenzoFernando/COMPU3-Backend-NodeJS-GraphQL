import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HealthStatus {
  @Field()
  status!: string;

  @Field()
  message!: string;

  @Field(() => GraphQLISODateTime)
  timestamp!: Date;
}
