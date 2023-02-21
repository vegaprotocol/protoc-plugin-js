import { expectType, TypeEqual } from 'ts-expect'
import { fixtures } from '../build/index'

expectType<TypeEqual<string, fixtures.core.Enum.Names>>(true)
